import * as Forge from "node-forge";
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
config();

export class DecryptCredentialsService {
  private cipher: string = "";
  private randomKey: string = "";
  private credentialsUser: string = "";
  private privateKey: string = "";

  constructor() {}

  public main(credentials: string): any {
    this.cipher = credentials;
    this.splitStringCipher();
    this.decodeBase64RandomKey();
    this.readPrivateKey();
    this.decryptRandomKey();
    this.decryptCredentialsUser();

    return this.credentialsUser;
  }

  private splitStringCipher() {
    const [randomKey, credentials] = this.cipher.split(".");
    this.randomKey = randomKey;
    this.credentialsUser = credentials;
  }

  private decodeBase64RandomKey() {
    this.randomKey = Forge.util.decode64(this.randomKey);
  }

  private readPrivateKey() {
    const filePath = process.env.PATH_PRIVATE_KEY!;
    this.privateKey = fs.readFileSync(path.resolve(filePath), "utf-8");
  }

  private decryptRandomKey() {
    const pem = this.privateKey;
    const passphrase = process.env.PASSWORD_PRIVATE_KEY!;
    const keydecrypt = Forge.pki.decryptRsaPrivateKey(pem, passphrase);
    this.randomKey = keydecrypt.decrypt(this.randomKey, "RSA-OAEP");
  }

  private decryptCredentialsUser() {
    const decipher = Forge.cipher.createDecipher("AES-ECB", this.randomKey);
    decipher.start();
    decipher.update(
      Forge.util.createBuffer(Forge.util.decode64(this.credentialsUser))
    );
    decipher.finish();
    this.credentialsUser = JSON.parse(decipher.output.toString());
  }
}
