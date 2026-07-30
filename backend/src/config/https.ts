import fs from "fs";
import path from "path";

/*
  HTTPS is enabled automatically when a cert/key pair exists in the repo-level
  `certs/` folder. Generate them once with mkcert (trusted, no browser warning):

    mkcert -install
    mkcert -cert-file certs/cert.pem -key-file certs/key.pem localhost 127.0.0.1

  (or with openssl for an untrusted self-signed pair). To go back to plain HTTP,
  remove the certs/ folder and set the *_ORIGIN/APP_URL env vars back to http.
*/
const CERT_DIR = path.resolve(process.cwd(), "..", "certs");
export const CERT_PATH = path.join(CERT_DIR, "cert.pem");
export const KEY_PATH = path.join(CERT_DIR, "key.pem");

export function httpsEnabled(): boolean {
  return fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH);
}

export function httpsOptions() {
  return {
    cert: fs.readFileSync(CERT_PATH),
    key: fs.readFileSync(KEY_PATH),
  };
}
