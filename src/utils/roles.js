export const PLATFORM_ROLES = {
	SUPER_ADMIN: "superAdmin",
	PARENT_ADMIN: "parentAdmin",
	PARENT: "parent",
	CAREGIVER: "caregiver",
};

export const FAMILY_ROLES = {
	PARENT: "parent",
	CAREGIVER: "caregiver",
};

export const PARENT_TYPES = {
	MOTHER: "mother",
	FATHER: "father",
};

export const OWNER_UID = "TGYVJ3HHl4Z56EYupmLlOuYHzPT2";
export const OWNER_EMAIL = "adwanajmi96@gmail.com";

export const DEFAULT_ACCOUNT_FIELDS = {
	role: PLATFORM_ROLES.PARENT_ADMIN,
	accountType: PLATFORM_ROLES.PARENT,
	parentType: PARENT_TYPES.FATHER,
};

export const normalizeRole = (role) => {
	if (role === "SUPER_ADMIN") return PLATFORM_ROLES.SUPER_ADMIN;
	if (role === "PARENT_ADMIN") return PLATFORM_ROLES.PARENT_ADMIN;
	return role;
};

export const isOwnerAccount = (user) =>
	user?.uid === OWNER_UID ||
	user?.email?.toLowerCase() === OWNER_EMAIL;

export const isSuperAdminUser = (user) =>
	isOwnerAccount(user) &&
	(normalizeRole(user?.role) === PLATFORM_ROLES.SUPER_ADMIN ||
		user?.platformRole === "SUPER_ADMIN");

export const getDefaultUserRoleFields = (authUser, currentData = {}) => {
	const owner = isOwnerAccount(authUser);
	const accountType = currentData.accountType || DEFAULT_ACCOUNT_FIELDS.accountType;
	return {
		role: owner
			? PLATFORM_ROLES.SUPER_ADMIN
			: normalizeRole(currentData.role) || DEFAULT_ACCOUNT_FIELDS.role,
		accountType,
		parentType:
			currentData.parentType ||
			(accountType === PLATFORM_ROLES.CAREGIVER
				? null
				: DEFAULT_ACCOUNT_FIELDS.parentType),
	};
};

export const getDisplayRole = ({
	user,
	familyRole,
	parentType,
	isFamilyCreator,
}) => {
	if (isSuperAdminUser(user)) return "Super Admin";
	if (normalizeRole(user?.role) === PLATFORM_ROLES.PARENT_ADMIN) {
		return "Parent Admin";
	}
	if (familyRole === FAMILY_ROLES.PARENT && isFamilyCreator) {
		return "Parent Admin";
	}
	const effectiveParentType = user?.parentType || parentType;
	if (
		familyRole === FAMILY_ROLES.PARENT &&
		effectiveParentType === PARENT_TYPES.FATHER
	) {
		return "Father";
	}
	if (familyRole === FAMILY_ROLES.PARENT) return "Mother";
	return "Caregiver";
};
