import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** QR Code gerado na hora apontando para /sala/CODIGO. */
export default function QrCodeSala({ url, tamanho = 260 }) {
  const [imagem, setImagem] = useState('');

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: tamanho * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0b1f26', light: '#f3efe6' },
    })
      .then(setImagem)
      .catch(() => setImagem(''));
  }, [url, tamanho]);

  return (
    <figure className="qr-sala">
      {imagem ? (
        <img src={imagem} width={tamanho} height={tamanho} alt={`QR Code para entrar na sala: ${url}`} />
      ) : (
        <div style={{ width: tamanho, height: tamanho }} />
      )}
    </figure>
  );
}
