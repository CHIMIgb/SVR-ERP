'use client';

import { useMemo } from 'react';
import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { posClasses } from './pos.styles';
import { buildQrMatrix, SPEI_ACCOUNT, QR_SIZE } from '@/lib/pos';
import { formatCurrency } from '@svr-erp/shared/utils/currency';

interface QrModalProps {
  amount: number;
  onClose: () => void;
  open?: boolean;
}

/** Modal con el QR (simulado) a mostrar y la cuenta SPEI a la que transferir. */
export function QrModal({ amount, onClose, open = true }: QrModalProps) {
  const matrix = useMemo(() => buildQrMatrix(SPEI_ACCOUNT), []);

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader title="Código QR" subtitle={`Transferir ${formatCurrency(amount)}`} />
      <ModalBody>
        <div className="flex justify-center">
          <div
            className="grid gap-px bg-slate-200 p-2 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)`,
              width: QR_SIZE * 10,
              height: QR_SIZE * 10,
            }}
          >
            {matrix.map((row, y) =>
              row.map((on, x) => (
                <div key={`${y}-${x}`} className={on ? 'bg-slate-900' : 'bg-white'} />
              )),
            )}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4 text-center">
          <p className={posClasses.fieldLabel}>Cuenta SPEI (simulada)</p>
          <p className="font-mono text-sm font-black text-slate-800">{SPEI_ACCOUNT}</p>
        </div>

        <Button variant="primary" fullWidth className="mt-4" onClick={onClose}>
          Listo, ya transfirió
        </Button>
      </ModalBody>
    </Modal>
  );
}