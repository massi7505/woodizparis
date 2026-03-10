// lib/backblaze.ts
// Utilise Clever Cloud Cellar (compatible S3)
//
// Variables d'env requises sur Railway :
//   B2_KEY_ID        → Cellar Access Key ID
//   B2_APP_KEY       → Cellar Secret Access Key
//   B2_BUCKET_NAME   → Nom du bucket ex: woodizparis
//   B2_ENDPOINT      → https://cellar-c2.services.clever-cloud.com
//   B2_PUBLIC_URL    → https://woodizparis.cellar-c2.services.clever-cloud.com

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

function getClient(): S3Client {
  const endpoint = process.env.B2_ENDPOINT;
  const keyId    = process.env.B2_KEY_ID;
  const appKey   = process.env.B2_APP_KEY;

  if (!endpoint || !keyId || !appKey) {
    throw new Error("[cellar] Variables B2_ENDPOINT, B2_KEY_ID ou B2_APP_KEY manquantes.");
  }

  return new S3Client({
    endpoint,
    region: "auto",
    credentials: { accessKeyId: keyId, secretAccessKey: appKey },
    forcePathStyle: true, // ⚠️ Requis pour Clever Cloud Cellar
  });
}

const BUCKET = () => {
  const b = process.env.B2_BUCKET_NAME;
  if (!b) throw new Error("[cellar] B2_BUCKET_NAME manquant.");
  return b;
};

const PUBLIC_URL = () => {
  const u = process.env.B2_PUBLIC_URL;
  if (!u) throw new Error("[cellar] B2_PUBLIC_URL manquant.");
  return u.replace(/\/$/, "");
};

/** Upload un buffer vers Cellar — retourne l'URL publique */
export async function uploadToB2(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket:      BUCKET(),
      Key:         key,
      Body:        buffer,
      ContentType: mimeType,
      ACL:         "public-read",
    })
  );
  return `${PUBLIC_URL()}/${key}`;
}

/** Supprime un fichier de Cellar */
export async function deleteFromB2(key: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({ Bucket: BUCKET(), Key: key })
  );
}

/** Vérifie si un fichier existe */
export async function existsInB2(key: string): Promise<boolean> {
  try {
    const client = getClient();
    await client.send(
      new HeadObjectCommand({ Bucket: BUCKET(), Key: key })
    );
    return true;
  } catch {
    return false;
  }
}

/** Génère la clé pour une image */
export function b2Key(type: string, id: string | number, ext = "webp"): string {
  return `woodiz/${type}/${id}.${ext}`;
}
