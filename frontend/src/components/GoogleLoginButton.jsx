import { GoogleLogin } from '@react-oauth/google';

export default function GoogleLoginButton({ onSuccess, onError, text = 'Continuar con Google' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        useOneTap
        text={text}
        width="100%"
        locale="es"
      />
    </div>
  );
}
