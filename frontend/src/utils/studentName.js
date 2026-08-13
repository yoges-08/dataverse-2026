// Resolve a student's display name with a safe fallback.
// Names live on the linked User doc; Student has no name field. Stored names
// like "." or whitespace are treated as missing and fall back to the email
// local-part, so dashboards never render "Unknown" or a bare dot.
const cleanName = (value) => {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  if (!v || v === '.' || v.length < 2) return '';
  return v;
};

export const getStudentName = (student, fallback = 'Student') => {
  if (!student) return fallback;
  const emailLocal = typeof student.email === 'string' ? student.email.split('@')[0] : '';
  return cleanName(student.user?.name || student.name || emailLocal) || fallback;
};
