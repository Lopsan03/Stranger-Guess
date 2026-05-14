import { useEffect, useState } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
}

export default function QRCode({ value, size = 150 }: QRCodeProps) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const encodedValue = encodeURIComponent(value);
    setUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&bgcolor=050508&color=ffffff&margin=10`);
  }, [value, size]);

  return (
    <div className="glass p-3 rounded-2xl inline-block shadow-2xl">
      {url ? (
        <img src={url} alt="QR Code" width={size} height={size} className="rounded-lg" />
      ) : (
        <div style={{ width: size, height: size }} className="bg-white/5 animate-pulse rounded-lg" />
      )}
    </div>
  );
}
