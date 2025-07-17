"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf';
import React from "react";

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface PDFPreviewDialogProps {
  pdfModal: { url: string; pageNumber?: number } | null;
  setPdfModal: (modal: { url: string; pageNumber?: number } | null) => void;
}

const PDFPreviewDialog: React.FC<PDFPreviewDialogProps> = ({ pdfModal, setPdfModal }) => {
  return (
    <Dialog open={!!pdfModal} onOpenChange={() => setPdfModal(null)}>
      <DialogContent className="max-w-3xl">
        {pdfModal && (
          <div>
            <DialogTitle>PDF Preview</DialogTitle>
            <div className="mt-2" style={{ height: 600, overflowY: 'auto' }}>
              <PDFDocument
                file={pdfModal.url.endsWith('.pdf') ? pdfModal.url : pdfModal.url + '.pdf'}
                onLoadError={console.error}
                loading={<div>Loading PDF...</div>}
              >
                {((({ numPages }: { numPages?: number }) =>
                  numPages
                    ? (<>
                        {Array.from({ length: numPages }, (_, i) => (
                          <Page key={i + 1} pageNumber={i + 1} width={700} />
                        ))}
                      </>)
                    : null
                ) as unknown as React.ReactNode)}
              </PDFDocument>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewDialog; 