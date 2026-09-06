export type Orientation = 'portrait' | 'landscape';
export type TemplateStyle = 'modern' | 'classic' | 'minimal' | 'corporate';
export type CardSide = 'front' | 'back';
export type CardStatus = 'Active' | 'Expired' | 'Revoked';

export interface IDCardDesign {
  id?: string;
  name: string; // Template template name
  orientation: Orientation;
  templateStyle: TemplateStyle;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  borderColor: string;
  watermarkText: string;
  watermarkOpacity: number;
  showGrid: boolean;
  gridSize: number;
  institutionName: string;
  institutionLogo: string; // Base64 or URL
  authorizedSignature: string; // Base64 or URL
  fontSizeName: number;
  fontSizeDetails: number;
  fontFamily: string;
  hideBarcode: boolean;
  hideQRCode: boolean;
}

export interface Student {
  id: string; // Unique enrollment number
  name: string;
  role: 'Student' | 'Faculty' | 'Staff';
  department: string;
  bloodGroup: string;
  dob: string;
  validUntil: string;
  emergencyContact: string;
  photo: string; // Base64 or URL
  status: CardStatus;
  createdAt: string;
}

export const LANGUAGES = {
  en: {
    title: 'ID Card Generator',
    subtitle: 'Generate professional School & College ID Cards in single or bulk batches',
    tabDesign: 'Design & Customize',
    tabBulk: 'Bulk Generation',
    tabDatabase: 'Student Database',
    tabTemplates: 'Saved Templates',
    layout: 'Layout & Orientation',
    templates: 'Pre-built Templates',
    colors: 'Branding & Colors',
    schoolDetails: 'Institution Details',
    studentDetails: 'Holder Details',
    photoUpload: 'Upload Photograph',
    logoUpload: 'Upload Logo',
    signatureUpload: 'Upload Signature',
    watermark: 'Watermark Opacity',
    exportOptions: 'Export & Print',
    guides: 'Ruler & Guides',
    databaseTitle: 'Registered Records',
    previewFront: 'ID Card Front Side',
    previewBack: 'ID Card Back Side',
    downloadPng: 'Download PNG (High-Res)',
    downloadPdf: 'Download PDF (Single)',
    downloadSvg: 'Download SVG',
    print: 'Print Card',
    email: 'Share via Email',
    saveTheme: 'Save as Template',
    uploadCSV: 'Upload CSV or Excel sheet',
    csvMapping: 'Column Mapping Matrix',
    generateBatch: 'Generate Chunked PDF',
    searchPlaceholder: 'Search by status, name, department, ID...',
    autoSaved: 'Design saved locally'
  },
  hi: {
    title: 'आईडी कार्ड जनरेटर',
    subtitle: 'स्कूलों और कॉलेजों के लिए व्यावसायिक आईडी कार्ड सिंगल या बल्क में जनरेट करें',
    tabDesign: 'डिज़ाइन और कस्टमाइज़',
    tabBulk: 'बल्क जनरेशन',
    tabDatabase: 'छात्र डेटाबेस',
    tabTemplates: 'सुरक्षित टेम्पलेट्स',
    layout: 'लेआउट और ओरिएंटेशन',
    templates: 'निर्मित टेम्पलेट्स',
    colors: 'ब्रांडिंग और रंग',
    schoolDetails: 'संस्थान के विवरण',
    studentDetails: 'धारक के विवरण',
    photoUpload: 'तस्वीर अपलोड करें',
    logoUpload: 'लोगो अपलोड करें',
    signatureUpload: 'हस्ताक्षर अपलोड करें',
    watermark: 'वॉटरमार्क अस्पष्टता',
    exportOptions: 'एक्सपोर्ट और प्रिंट',
    guides: 'रूलर और गाइडलाइन्स',
    databaseTitle: 'पंजीकृत रिकॉर्ड्स',
    previewFront: 'आईडी कार्ड मुख्य भाग',
    previewBack: 'आईडी कार्ड पिछला भाग',
    downloadPng: 'पीएनजी डाउनलोड करें (उच्च-रिज़ॉल्यूशन)',
    downloadPdf: 'पीडीएफ डाउनलोड करें (एकल)',
    downloadSvg: 'एसवीजी डाउनलोड करें',
    print: 'कार्ड प्रिंट करें',
    email: 'ईमेल द्वारा साझा करें',
    saveTheme: 'टेम्पलेट सहेजें',
    uploadCSV: 'सीएसवी या एक्सेल शीट अपलोड करें',
    csvMapping: 'कॉलम मैपिंग मैट्रिक्स',
    generateBatch: 'चंक्ड पीडीएफ जनरेट करें',
    searchPlaceholder: 'नाम, विभाग, स्थिति या आईडी से खोजें...',
    autoSaved: 'डिज़ाइन स्थानीय रूप से सहेजा गया'
  },
  es: {
    title: 'Generador de Tarjetas de ID',
    subtitle: 'Cree tarjetas de identificación profesionales para escuelas y universidades de forma individual o masiva',
    tabDesign: 'Diseño y Personalizar',
    tabBulk: 'Generación Masiva',
    tabDatabase: 'Base de Datos de Estudiantes',
    tabTemplates: 'Plantillas Guardadas',
    layout: 'Diseño y Orientación',
    templates: 'Plantillas Preestablecidas',
    colors: 'Imagen de Marca y Colores',
    schoolDetails: 'Detalles de la Institución',
    studentDetails: 'Detalles del Titular',
    photoUpload: 'Subir Fotografía',
    logoUpload: 'Subir Logotipo',
    signatureUpload: 'Subir Firma Autorizada',
    watermark: 'Opacidad de la Marca de Agua',
    exportOptions: 'Exportar e Imprimir',
    guides: 'Regla y Guías',
    databaseTitle: 'Registros Registrados',
    previewFront: 'Frente de la Tarjeta',
    previewBack: 'Reverso de la Tarjeta',
    downloadPng: 'Descargar PNG (Alta Res)',
    downloadPdf: 'Descargar PDF (Individual)',
    downloadSvg: 'Descargar SVG',
    print: 'Imprimir Tarjeta',
    email: 'Compartir por Correo',
    saveTheme: 'Guardar como Plantilla',
    uploadCSV: 'Cargar archivo CSV o Excel',
    csvMapping: 'Matriz de Mapeo de Columnas',
    generateBatch: 'Generar PDF en Bloque',
    searchPlaceholder: 'Buscar por nombre, curso, estado, ID...',
    autoSaved: 'Diseño guardado localmente'
  }
};

export const INITIAL_DESIGN: IDCardDesign = {
  name: 'Default ID Template',
  orientation: 'portrait',
  templateStyle: 'modern',
  primaryColor: '#3b82f6', // Bright modern blue
  secondaryColor: '#1d4ed8', // Royal deep blue
  textColor: '#1e293b', // Slate gray
  borderColor: '#e2e8f0', // Clean boundary gray
  watermarkText: 'OFFICIAL ID',
  watermarkOpacity: 0.1,
  showGrid: false,
  gridSize: 10,
  institutionName: 'UNIVERSITY OF SCIENCE & EDUCATION',
  institutionLogo: '',
  authorizedSignature: '',
  fontSizeName: 16,
  fontSizeDetails: 12,
  fontFamily: 'Inter',
  hideBarcode: false,
  hideQRCode: false
};

export const INITIAL_STUDENT: Student = {
  id: 'STU-2026-089',
  name: 'Alex Rivera',
  role: 'Student',
  department: 'Computer Science & Engineering',
  bloodGroup: 'B+',
  dob: '2004-11-12',
  validUntil: '2028-06-30',
  emergencyContact: '+1 (555) 304-9821',
  photo: '',
  status: 'Active',
  createdAt: new Date().toISOString()
};
