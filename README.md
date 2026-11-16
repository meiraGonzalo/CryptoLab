# CriptoLab · Laboratorio visual de criptografía

Plataforma educativa e interactiva para comprender cómo funcionan por dentro AES, RSA y SHA-2. Cada valor intermedio se calcula con una implementación completa del algoritmo y se representa paso a paso con matrices, registros, diagramas y fórmulas.

## Requisitos

- Node.js 18 o superior (probado con Node 26)
- Un navegador moderno (Chrome, Edge, Firefox, Safari)

## Instalación y ejecución

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm test           # pruebas del motor criptográfico (vectores FIPS-197 y FIPS 180-4)
npm run build      # verificación de tipos + compilación de producción en dist/
npm run preview    # sirve la compilación de producción
```

La aplicación funciona por completo en el navegador: no hay backend ni base de datos.

### Versión de escritorio (Windows)

La misma compilación se empaqueta con Electron (`electron/main.cjs` abre `dist/index.html` en una ventana propia):

```bash
npm run desktop    # compila y abre la app en una ventana de escritorio
npm run dist:win   # compila y genera en release/ el instalador y la versión portable
```

- `release/CriptoLab-Setup-<versión>.exe`: instalador con acceso directo en el escritorio.
- `release/CriptoLab-Portable-<versión>.exe`: ejecutable único que no requiere instalación.

Las fuentes (Inter y JetBrains Mono) están incluidas en el paquete, así que la versión de escritorio funciona sin conexión. Los ejecutables no están firmados digitalmente: Windows SmartScreen puede mostrar una advertencia la primera vez («Más información» → «Ejecutar de todas formas»).

## Contenido

| Sección | Qué permite hacer |
| --- | --- |
| **AES-128 / 192 / 256** | Cifrar y descifrar paso a paso: bytes, bloques y relleno PKCS#7, matriz de estado, SubBytes (con la S-Box), ShiftRows animado, MixColumns con la aritmética en GF(2⁸), AddRoundKey bit a bit y una pestaña dedicada a la expansión de clave (RotWord, SubWord, Rcon). |
| **RSA** | Generación de claves (p, q, n, φ(n), e, d con Euclides extendido), cifrado y descifrado con exponenciación modular «elevar al cuadrado y multiplicar», diagrama de relaciones y un laboratorio RSA-OAEP real con Web Crypto API. |
| **SHA-256 / SHA-512** | Relleno, longitud, bloques, expansión W₀…W₆₃/W₇₉, registros A–H, cada ronda con Σ0, Σ1, Ch, Maj, T1 y T2, y la composición del hash final. |
| **Comparación de hashes y efecto avalancha** | Hashes en paralelo, bits distintos resaltados y proporción de bits modificados. |
| **Herramientas** | Texto ↔ hexadecimal, hexadecimal ↔ binario, visualizador de bytes, generador de claves, generador de números aleatorios y comparador de resultados. |

Controles de simulación: avanzar/retroceder una operación (← / →), avanzar/retroceder una ronda (Shift + ← / →), reproducción automática con pausa y reanudación (barra espaciadora), reinicio, barra de posición y velocidad.

## Arquitectura

```
src/
  components/      Componentes compartidos (layout, navegación, controles, visualizaciones)
  hooks/           Reproducción automática, atajos de teclado, portapapeles
  modules/
    aes/           engine/ (cifrado, expansión de clave, traza de estados) · components/ · store/ · types/
    rsa/           engine/ (aritmética modular, Miller–Rabin, claves) · components/ · store/ · types/
    sha/           engine/ (SHA-2 genérico, traza, pasos) · components/ · store/ · types/
  pages/           Inicio y herramientas complementarias
  services/crypto/ Aleatoriedad segura (getRandomValues) y Web Crypto API
  stores/          Store genérico de simulación (Zustand), navegación y estado de UI
  utils/           Conversión de bytes, hexadecimal, binario y Base64
```

Separación de responsabilidades:

1. **Lógica criptográfica** (`modules/*/engine`): funciones puras y tipadas, sin dependencias de React.
2. **Generación de estados intermedios**: cada operación produce estado anterior, parámetros, estado posterior y explicación. La traza de AES se contrasta internamente con el cifrado de referencia.
3. **Progreso de la simulación** (`stores/createSimulationStore.ts`): los pasos se calculan una sola vez; avanzar o retroceder solo cambia el índice, nunca recalcula.
4. **Representación visual y animaciones**: los componentes leen los pasos y los representan; no contienen cálculos criptográficos.

## Verificación

- Pruebas automáticas con los vectores oficiales de FIPS-197 (AES, incluida la expansión de clave del Apéndice A.1) y FIPS 180-4 (SHA-256 y SHA-512, de uno y dos bloques), y el ejemplo clásico de RSA (p = 61, q = 53).
- La S-Box y las constantes de SHA-2 se derivan matemáticamente (inverso en GF(2⁸) + transformación afín; raíces cuadradas y cúbicas de primos) y las pruebas confirman que coinciden con los estándares.
- En la interfaz, los resultados de AES y SHA se comparan en vivo con Web Crypto API. Como la mayoría de los navegadores no admite AES-192 en Web Crypto, en ese caso se valida con el vector oficial FIPS-197.

## Limitaciones

- Las implementaciones educativas **no deben usarse para proteger información real**: no son de tiempo constante y AES se muestra en modo ECB (cada bloque por separado) para poder observarlo.
- El RSA educativo usa primos pequeños, φ(n) y ningún relleno; el cifrado byte a byte es determinista e inseguro. El modo real usa RSA-OAEP (SHA-256) con claves de 2048–4096 bits, cuya clave privada se genera como no extraíble y solo existe en memoria mientras la sección está abierta.
- Para mantener la visualización fluida, AES admite hasta 256 bytes de mensaje, SHA hasta 1024 bytes y el RSA educativo hasta 64 bytes de texto.
- No se almacena ninguna clave ni mensaje: todo el estado vive en memoria y se pierde al recargar la página.
# CryptoLab
