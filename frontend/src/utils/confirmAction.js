import Swal from "sweetalert2";

// One confirmation dialog for the whole app (SweetAlert2), styled to match
// the dashboard. Resolves to true only when the person confirms.
//
//   if (!(await confirmAction({ title, text, confirmText, tone: "danger" }))) return;
//
// tone "danger" is for actions that remove access or can't be undone; it
// puts initial focus on Cancel so a stray Enter doesn't confirm.
export async function confirmAction({
  title,
  text,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "primary",
}) {
  const result = await Swal.fire({
    title,
    text,
    icon: tone === "danger" ? "warning" : "question",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: tone === "danger",
    buttonsStyling: false,
    customClass: {
      popup: "pd-swal-popup",
      title: "pd-swal-title",
      htmlContainer: "pd-swal-text",
      actions: "pd-swal-actions",
      confirmButton: `pd-swal-button ${tone === "danger" ? "is-danger" : "is-primary"}`,
      cancelButton: "pd-swal-button is-secondary",
    },
  });

  return result.isConfirmed;
}
