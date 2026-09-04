//#region src/lib/cvp/permissions.ts
var MAP = {
	ADMIN: [
		"manage_people",
		"manage_tasks",
		"manage_goods",
		"manage_ot",
		"execute",
		"attendance",
		"backup",
		"settings",
		"view"
	],
	LEADER: [
		"manage_people",
		"manage_tasks",
		"manage_goods",
		"manage_ot",
		"execute",
		"attendance",
		"view"
	],
	USER: [
		"execute",
		"attendance",
		"view"
	],
	VIEWER: ["view"]
};
function can(role, perm) {
	if (!role) return false;
	return MAP[role]?.includes(perm) ?? false;
}
//#endregion
export { can as t };
