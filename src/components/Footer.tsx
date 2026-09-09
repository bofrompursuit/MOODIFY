import QRCode from "qrcode";

const VENMO_HANDLE = "beau_moldenhauer";
const VENMO_URL = `https://venmo.com/u/${VENMO_HANDLE}`;

// Server Component so the QR code is generated once at render time (real
// QR encoding via the `qrcode` package, not an approximation) with zero
// client-side JS cost.
export async function Footer() {
  const qrSvg = await QRCode.toString(VENMO_URL, {
    type: "svg",
    margin: 1,
    color: { dark: "#141118", light: "#ffffff" },
  });

  return (
    <footer className="mt-auto border-t border-white/10 px-6 py-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
      <a
        href={VENMO_URL}
        target="_blank"
        rel="noreferrer"
        title={`Venmo @${VENMO_HANDLE}`}
        className="shrink-0 w-16 h-16 rounded-lg bg-white p-1.5 shadow-md [&_svg]:w-full [&_svg]:h-full"
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />
      <p className="text-xs text-white/50 max-w-sm">
        Donate to my SMB &amp; my future apps through Venmo:{" "}
        <a
          href={VENMO_URL}
          target="_blank"
          rel="noreferrer"
          className="text-accent-2 hover:underline"
        >
          @{VENMO_HANDLE}
        </a>
      </p>
    </footer>
  );
}
