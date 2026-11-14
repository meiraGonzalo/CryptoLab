import { ArrowDownUp } from 'lucide-react';
import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Field, TextArea } from '@/components/common/Field';
import { ValueBox } from '@/components/common/ValueBox';
import { ByteCell } from '@/components/visualizations/ByteCell';
import { useToolsStore } from '@/stores/toolsStore';
import { bytesToBase64, bytesToHex, bytesToUtf8, hexToBytes, utf8CharacterMap, utf8ToBytes, validateHex } from '@/utils/bytes';
import { ToolLayout } from './ToolLayout';

export default function TextHexTool() {
  const text = useToolsStore((s) => s.textHexText);
  const set = useToolsStore((s) => s.set);
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const [hexError, setHexError] = useState<string | null>(null);

  const bytes = utf8ToBytes(text);
  const hex = bytesToHex(bytes, ' ');

  const onHexChange = (value: string) => {
    setHexDraft(value);
    const error = validateHex(value);
    if (value.trim() === '') {
      setHexError(null);
      set({ textHexText: '' });
      return;
    }
    if (error) return setHexError(error);
    const decoded = bytesToUtf8(hexToBytes(value));
    if (decoded === null) return setHexError('Estos bytes no forman texto UTF-8 válido.');
    setHexError(null);
    set({ textHexText: decoded });
  };

  return (
    <ToolLayout title="Texto ↔ hexadecimal" description="Convierte texto a su representación en bytes (UTF-8) y viceversa. Editá cualquiera de los dos campos.">
      <Card>
        <CardHeader icon={<ArrowDownUp size={17} />} title="Conversión bidireccional" />
        <CardBody className="grid gap-5 lg:grid-cols-2">
          <Field label="Texto" htmlFor="th-text" hint={`${Array.from(text).length} caracteres · ${bytes.length} bytes`}>
            <TextArea
              id="th-text"
              rows={5}
              value={text}
              onChange={(e) => {
                set({ textHexText: e.target.value });
                setHexDraft(null);
                setHexError(null);
              }}
            />
          </Field>
          <Field label="Hexadecimal" htmlFor="th-hex" error={hexError}>
            <TextArea id="th-hex" rows={5} mono value={hexDraft ?? hex} onChange={(e) => onHexChange(e.target.value)} invalid={Boolean(hexError)} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Carácter por carácter" subtitle="Los caracteres fuera de ASCII ocupan varios bytes en UTF-8." />
        <CardBody>
          <div className="flex flex-wrap gap-3">
            {utf8CharacterMap(text).slice(0, 300).map((entry, i) => (
              <div key={i} className={`panel-inset flex flex-col items-center gap-1.5 px-2 py-1.5 ${entry.bytes.length > 1 ? 'border-accent-sub/30' : ''}`}>
                <span className="text-base font-semibold text-white">{entry.char === ' ' ? '␣' : entry.char === '\n' ? '↵' : entry.char}</span>
                <span className="text-[11px] text-slate-500">U+{entry.char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}</span>
                <div className="flex gap-1">
                  {entry.bytes.map((b, j) => (
                    <ByteCell key={j} value={b} size="sm" tone={entry.bytes.length > 1 ? 'sub' : 'data'} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <ValueBox label="Hexadecimal compacto" value={bytesToHex(bytes)} tone="data" />
        <ValueBox label="Base64" value={bytesToBase64(bytes)} tone="sub" />
      </div>
    </ToolLayout>
  );
}
