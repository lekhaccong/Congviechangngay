import { t as Button } from "./button-DcNvoXBX.js";
import { t as Dialog } from "./dialog-DxJ4fdRy.js";
import { i as Textarea, n as Input, r as NativeSelect, t as Field } from "./input-D0c9ilIZ.js";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/cvp/person-form.tsx
function PersonForm({ open, onClose, groups, shifts, initial, onSave }) {
	const [code, setCode] = useState("");
	const [name, setName] = useState("");
	const [serialNumber, setSerial] = useState("");
	const [groupId, setGroupId] = useState("");
	const [shiftId, setShiftId] = useState("");
	const [status, setStatus] = useState("ACTIVE");
	const [role, setRole] = useState("USER");
	const [note, setNote] = useState("");
	useEffect(() => {
		if (!open) return;
		setCode(initial?.code ?? "");
		setName(initial?.name ?? "");
		setSerial(initial?.serialNumber ?? "");
		setGroupId(initial?.groupId ?? groups[0]?.id ?? "");
		setShiftId(initial?.shiftId ?? shifts[0]?.id ?? "");
		setStatus(initial?.status ?? "ACTIVE");
		setRole(initial?.role ?? "USER");
		setNote(initial?.note ?? "");
	}, [
		open,
		initial,
		groups,
		shifts
	]);
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onClose,
		title: initial ? "Sửa nhân sự" : "Thêm nhân sự",
		children: /* @__PURE__ */ jsxs("form", {
			className: "space-y-3",
			onSubmit: async (e) => {
				e.preventDefault();
				await onSave({
					code,
					name,
					serialNumber,
					groupId,
					shiftId,
					status,
					role,
					note
				});
			},
			children: [
				/* @__PURE__ */ jsx(Field, {
					label: "Mã nhân viên",
					children: /* @__PURE__ */ jsx(Input, {
						value: code,
						onChange: (e) => setCode(e.target.value),
						required: true
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Họ tên",
					children: /* @__PURE__ */ jsx(Input, {
						value: name,
						onChange: (e) => setName(e.target.value),
						required: true
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "SBD / STT",
					children: /* @__PURE__ */ jsx(Input, {
						value: serialNumber,
						onChange: (e) => setSerial(e.target.value)
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Nhóm",
					children: /* @__PURE__ */ jsx(NativeSelect, {
						value: groupId,
						onChange: (e) => setGroupId(e.target.value),
						children: groups.map((g) => /* @__PURE__ */ jsx("option", {
							value: g.id,
							children: g.name
						}, g.id))
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Ca",
					children: /* @__PURE__ */ jsx(NativeSelect, {
						value: shiftId,
						onChange: (e) => setShiftId(e.target.value),
						children: shifts.map((s) => /* @__PURE__ */ jsx("option", {
							value: s.id,
							children: s.name
						}, s.id))
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Trạng thái",
					children: /* @__PURE__ */ jsxs(NativeSelect, {
						value: status,
						onChange: (e) => setStatus(e.target.value),
						children: [
							/* @__PURE__ */ jsx("option", {
								value: "ACTIVE",
								children: "Đang làm"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "LEAVE",
								children: "Nghỉ"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "SUSPENDED",
								children: "Tạm hoãn"
							})
						]
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Quyền",
					children: /* @__PURE__ */ jsxs(NativeSelect, {
						value: role,
						onChange: (e) => setRole(e.target.value),
						children: [
							/* @__PURE__ */ jsx("option", {
								value: "ADMIN",
								children: "Quản trị"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "LEADER",
								children: "Tổ trưởng"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "USER",
								children: "Nhân sự"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "VIEWER",
								children: "Chỉ xem"
							})
						]
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "Ghi chú",
					children: /* @__PURE__ */ jsx(Textarea, {
						value: note,
						onChange: (e) => setNote(e.target.value)
					})
				}),
				/* @__PURE__ */ jsx(Button, {
					type: "submit",
					className: "w-full",
					children: "Lưu"
				})
			]
		})
	});
}
//#endregion
export { PersonForm as t };
