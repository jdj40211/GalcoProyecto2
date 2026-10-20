import { defineStore } from 'pinia';

const emptyData = () => ({
  fecha: '',
  valor: '',
  subtotal: '',
  impuestos: '',
  nit: '',
  numeroDocumento: '',
  proveedor: '',
  moneda: 'COP',
  ciudad: '',
  metodoPago: '',
  tipoGasto: '',
  concepto: '',
  observaciones: ''
});

export const useWorkflowStore = defineStore('workflow', {
  state: () => ({
    file: null,
    fileDataUrl: '',
    // Copia preprocesada que solo se envía al OCR; el original es el que se guarda (HU-25, CA7).
    ocr: null,
    extraction: null,
    form: emptyData(),
    lastRecord: null,
    lastExport: null
  }),
  actions: {
    setFile(file, fileDataUrl, ocr = null) {
      this.file = { name: file.name, type: file.type, size: file.size };
      this.fileDataUrl = fileDataUrl;
      this.ocr = ocr;
      this.extraction = null;
    },
    setExtraction(extraction) {
      this.extraction = extraction;
      this.form = { ...emptyData(), ...extraction.datos, observaciones: extraction.observaciones || '' };
    },
    clearUpload() {
      this.file = null;
      this.fileDataUrl = '';
      this.ocr = null;
      this.extraction = null;
      this.form = emptyData();
    },
    complete(record, exported) {
      this.lastRecord = record;
      this.lastExport = exported;
      this.clearUpload();
    }
  }
});
