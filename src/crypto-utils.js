import crypto from 'crypto';

/**
 * Utilidad de encriptación para seguridad de datos locales
 * Usa AES-256-GCM para encriptación segura
 */
export class CryptoUtils {
  constructor(masterKey = null) {
    // Si no se proporciona clave maestra, se genera una automáticamente
    this.masterKey = masterKey || crypto.randomBytes(32);
    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Encripta datos usando AES-256-GCM
   * Optimized to reduce type checking overhead
   * @param {string|object} data - Datos a encriptar
   * @returns {object} Objeto con datos encriptados, IV y authTag
   */
  encrypt(data) {
    try {
      // Optimize: Check type only once and handle strings directly
      let dataString;
      if (typeof data === 'string') {
        dataString = data;
      } else {
        dataString = JSON.stringify(data);
      }
      
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
      
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Error al encriptar: ${error.message}`);
    }
  }

  /**
   * Desencripta datos previamente encriptados
   * @param {object} encryptedData - Objeto con encrypted, iv y authTag
   * @returns {any} Datos desencriptados
   */
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.masterKey,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Intentar parsear como JSON, si falla retornar string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      throw new Error(`Error al desencriptar: ${error.message}`);
    }
  }

  /**
   * Genera un hash de autenticación para verificación de integridad
   * @param {string} data - Datos a hashear
   * @returns {string} Hash SHA-256
   */
  generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Exporta la clave maestra en formato hex para almacenamiento seguro
   * @returns {string} Clave maestra en formato hex
   */
  exportKey() {
    return this.masterKey.toString('hex');
  }

  /**
   * Importa una clave maestra desde formato hex
   * @param {string} keyHex - Clave en formato hex
   */
  importKey(keyHex) {
    this.masterKey = Buffer.from(keyHex, 'hex');
  }
}
