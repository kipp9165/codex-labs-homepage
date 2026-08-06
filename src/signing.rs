use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};

const DEFAULT_PRIVATE_KEY_HEX: &str = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

fn signing_key_from_hex(private_key_hex: Option<&str>) -> Result<SigningKey, String> {
    let key_hex = private_key_hex.unwrap_or(DEFAULT_PRIVATE_KEY_HEX);
    let key_bytes = hex::decode(key_hex).map_err(|e| format!("invalid private key hex: {e}"))?;

    if key_bytes.len() != 32 {
        return Err("private key must decode to 32 bytes".to_string());
    }

    let key_array: [u8; 32] = key_bytes
        .try_into()
        .map_err(|_| "failed to convert key bytes".to_string())?;

    Ok(SigningKey::from_bytes(&key_array))
}

pub fn sign_payload(payload: &[u8], private_key_hex: Option<&str>) -> Result<(String, String), String> {
    let signing_key = signing_key_from_hex(private_key_hex)?;
    let verify_key: VerifyingKey = signing_key.verifying_key();
    let signature: Signature = signing_key.sign(payload);

    let signature_hex = hex::encode(signature.to_bytes());
    let public_key_hex = hex::encode(verify_key.to_bytes());

    Ok((signature_hex, public_key_hex))
}

pub fn verify_signature(payload: &[u8], signature_hex: &str, public_key_hex: &str) -> bool {
    let signature_bytes = match hex::decode(signature_hex) {
        Ok(v) => v,
        Err(_) => return false,
    };

    let public_key_bytes = match hex::decode(public_key_hex) {
        Ok(v) => v,
        Err(_) => return false,
    };

    let signature_array: [u8; 64] = match signature_bytes.try_into() {
        Ok(v) => v,
        Err(_) => return false,
    };

    let public_key_array: [u8; 32] = match public_key_bytes.try_into() {
        Ok(v) => v,
        Err(_) => return false,
    };

    let signature = Signature::from_bytes(&signature_array);
    let verify_key = match VerifyingKey::from_bytes(&public_key_array) {
        Ok(v) => v,
        Err(_) => return false,
    };

    verify_key.verify(payload, &signature).is_ok()
}
