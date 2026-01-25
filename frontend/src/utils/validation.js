// Frontend email validation helper
export const validateEmail = email => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const getEmailError = email => {
  if (!email) return 'Email requerido';
  if (!validateEmail(email)) return 'Email inválido. Usa formato: usuario@dominio.com';
  return '';
};
