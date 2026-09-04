//#region src/lib/cvp/mail.ts
function openMail(subject, body) {
	const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	window.location.href = url;
}
function lotCloseMail(input) {
	openMail(`[CHỐT LOT] ${input.lotCode}`, [
		`Lot: ${input.lotCode}`,
		`Invoice: ${input.invoice}`,
		`Mã SP: ${input.productCode}`,
		`Số lượng: ${input.quantity}`,
		`Người thực hiện: ${input.closer}`,
		`Thời gian: ${input.time}`,
		`Trạng thái: ${input.status}`,
		input.note ? `Ghi chú: ${input.note}` : ""
	].filter(Boolean).join("\n"));
}
function abnormalMail(input) {
	openMail(`[BẤT THƯỜNG] ${input.type}`, [
		`Loại: ${input.type}`,
		`Mức độ: ${input.severity}`,
		`Mô tả: ${input.description}`,
		`Người phát hiện: ${input.detector}`,
		`Thời gian: ${input.time}`
	].join("\n"));
}
function missingDataMail(input) {
	openMail(`[THIẾU DATA] ${input.productCode}`, [
		`Mã SP: ${input.productCode}`,
		`Invoice: ${input.invoice}`,
		`Ghi chú: ${input.note}`
	].join("\n"));
}
function missingGoodsMail(input) {
	openMail(`[HÀNG THIẾU] ${input.productCode}`, [
		`Mã SP: ${input.productCode}`,
		`Invoice: ${input.invoice}`,
		`Lot: ${input.lot}`,
		`Ghi chú: ${input.note}`
	].join("\n"));
}
//#endregion
export { openMail as a, missingGoodsMail as i, lotCloseMail as n, missingDataMail as r, abnormalMail as t };
