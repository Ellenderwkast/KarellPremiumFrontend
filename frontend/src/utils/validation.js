// Frontend email validation helper
export const validateEmail = email => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const getEmailError = email => {
  if (!email) return 'Correo requerido';
  if (!validateEmail(email)) return 'Correo inválido. Usa formato: usuario@correo.com';
  return '';
};
