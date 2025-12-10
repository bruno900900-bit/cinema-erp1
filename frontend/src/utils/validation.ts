// Utilitários de validação para payloads da API

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PayloadValidator {
  // Validar dados de usuário
  static validateUserCreate(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email é obrigatório e deve ser uma string');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email deve ter um formato válido');
    }

    if (!data.full_name || typeof data.full_name !== 'string') {
      errors.push('Nome completo é obrigatório e deve ser uma string');
    } else if (data.full_name.trim().length < 2) {
      errors.push('Nome completo deve ter pelo menos 2 caracteres');
    }

    if (!data.password || typeof data.password !== 'string') {
      errors.push('Senha é obrigatória e deve ser uma string');
    } else if (data.password.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }

    if (data.phone && typeof data.phone !== 'string') {
      errors.push('Telefone deve ser uma string');
    }

    if (data.bio && typeof data.bio !== 'string') {
      errors.push('Biografia deve ser uma string');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validar dados de projeto
  static validateProjectCreate(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string') {
      errors.push('Título é obrigatório e deve ser uma string');
    } else if (data.title.trim().length < 3) {
      errors.push('Título deve ter pelo menos 3 caracteres');
    }

    // Aceitar múltiplas formas e também objetos aninhados com nome do cliente
    const extractName = (val: any): string | undefined => {
      if (!val) return undefined;
      if (typeof val === 'string') return val.trim() || undefined;
      if (typeof val === 'object') {
        const nested =
          val.name ||
          val.full_name ||
          val.fullName ||
          val.nome ||
          val.razao_social ||
          val.razaoSocial ||
          val.company ||
          val.companyName;
        if (typeof nested === 'string' && nested.trim().length > 0) {
          return nested.trim();
        }
      }
      return undefined;
    };

    // Aceitar múltiplas chaves: client_name (snake), clientName (camel), client/customer/cliente (string ou objeto)
    const clientName: string | undefined = (() => {
      if (!data) return undefined;
      const candidates = [
        data.client_name,
        data.clientName,
        data.client,
        data.customerName,
        data.customer,
        data.cliente,
        data.nomeCliente,
      ];
      for (const c of candidates) {
        const name = extractName(c);
        if (name) return name;
      }
      return undefined;
    })();
    // Nome do cliente é opcional. Se fornecido, validar tamanho mínimo.
    if (clientName !== undefined && clientName.trim().length < 2) {
      errors.push('Nome do cliente deve ter pelo menos 2 caracteres');
    }

    if (data.description && typeof data.description !== 'string') {
      errors.push('Descrição deve ser uma string');
    }

    if (
      data.budget !== undefined &&
      (typeof data.budget !== 'number' || data.budget < 0)
    ) {
      errors.push('Orçamento deve ser um número positivo');
    }

    if (
      data.start_date &&
      !(data.start_date instanceof Date) &&
      typeof data.start_date !== 'string'
    ) {
      errors.push('Data de início deve ser uma data válida');
    }

    if (
      data.end_date &&
      !(data.end_date instanceof Date) &&
      typeof data.end_date !== 'string'
    ) {
      errors.push('Data de fim deve ser uma data válida');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validar dados de locação
  static validateLocationCreate(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string') {
      errors.push('Título é obrigatório e deve ser uma string');
    } else if (data.title.trim().length < 3) {
      errors.push('Título deve ter pelo menos 3 caracteres');
    }

    if (!data.status || typeof data.status !== 'string') {
      errors.push('Status é obrigatório e deve ser uma string');
    }

    if (
      data.priceDayCinema !== undefined &&
      (typeof data.priceDayCinema !== 'number' || data.priceDayCinema < 0)
    ) {
      errors.push('Preço por dia (cinema) deve ser um número positivo');
    }

    if (
      data.priceHourCinema !== undefined &&
      (typeof data.priceHourCinema !== 'number' || data.priceHourCinema < 0)
    ) {
      errors.push('Preço por hora (cinema) deve ser um número positivo');
    }

    if (
      data.priceDayPublicidade !== undefined &&
      (typeof data.priceDayPublicidade !== 'number' ||
        data.priceDayPublicidade < 0)
    ) {
      errors.push('Preço por dia (publicidade) deve ser um número positivo');
    }

    if (
      data.priceHourPublicidade !== undefined &&
      (typeof data.priceHourPublicidade !== 'number' ||
        data.priceHourPublicidade < 0)
    ) {
      errors.push('Preço por hora (publicidade) deve ser um número positivo');
    }

    if (
      data.capacity !== undefined &&
      (typeof data.capacity !== 'number' || data.capacity < 0)
    ) {
      errors.push('Capacidade deve ser um número positivo');
    }

    if (
      data.areaSize !== undefined &&
      (typeof data.areaSize !== 'number' || data.areaSize < 0)
    ) {
      errors.push('Tamanho da área deve ser um número positivo');
    }

    if (
      data.parkingSpots !== undefined &&
      (typeof data.parkingSpots !== 'number' || data.parkingSpots < 0)
    ) {
      errors.push(
        'Número de vagas de estacionamento deve ser um número positivo'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validar dados de visita
  static validateVisitCreate(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string') {
      errors.push('Título é obrigatório e deve ser uma string');
    } else if (data.title.trim().length < 3) {
      errors.push('Título deve ter pelo menos 3 caracteres');
    }

    if (!data.locationId || typeof data.locationId !== 'string') {
      errors.push('ID da locação é obrigatório e deve ser uma string');
    }

    if (
      !data.scheduledDate ||
      (!(data.scheduledDate instanceof Date) &&
        typeof data.scheduledDate !== 'string')
    ) {
      errors.push('Data agendada é obrigatória e deve ser uma data válida');
    }

    if (
      data.duration &&
      (typeof data.duration !== 'number' || data.duration < 0)
    ) {
      errors.push('Duração deve ser um número positivo');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validar arquivo
  static validateFile(
    file: File,
    options: {
      maxSizeMB?: number;
      allowedTypes?: string[];
      required?: boolean;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    const {
      maxSizeMB = 10,
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      required = true,
    } = options;

    if (required && !file) {
      errors.push('Arquivo é obrigatório');
      return { isValid: false, errors };
    }

    if (!file) {
      return { isValid: true, errors: [] };
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(
        `Tipo de arquivo não suportado. Tipos permitidos: ${allowedTypes.join(
          ', '
        )}`
      );
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      errors.push(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validar email
  static validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Validar telefone brasileiro
  static validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  // Validar CPF
  static validateCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');

    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  }

  // Validar CNPJ
  static validateCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;

    sum = 0;
    weight = 2;
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;

    return true;
  }

  // Validar URL
  static validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Validar data
  static validateDate(date: string | Date): boolean {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj instanceof Date && !isNaN(dateObj.getTime());
    } catch {
      return false;
    }
  }

  // Validar se data é futura
  static validateFutureDate(date: string | Date): boolean {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      return (
        this.validateDate(date) &&
        !isNaN(dateObj.getTime()) &&
        !isNaN(now.getTime()) &&
        dateObj > now
      );
    } catch {
      return false;
    }
  }

  // Validar se data é passada
  static validatePastDate(date: string | Date): boolean {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      return (
        this.validateDate(date) &&
        !isNaN(dateObj.getTime()) &&
        !isNaN(now.getTime()) &&
        dateObj < now
      );
    } catch {
      return false;
    }
  }

  // Validar range de datas
  static validateDateRange(
    startDate: string | Date,
    endDate: string | Date
  ): boolean {
    try {
      const start =
        typeof startDate === 'string' ? new Date(startDate) : startDate;
      const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

      return (
        this.validateDate(start) &&
        this.validateDate(end) &&
        !isNaN(start.getTime()) &&
        !isNaN(end.getTime()) &&
        start <= end
      );
    } catch {
      return false;
    }
  }
}

// Função helper para validar payload antes de enviar
export function validatePayload<T>(
  data: T,
  validator: (data: any) => ValidationResult,
  context: string = 'dados'
): T {
  const result = validator(data);

  if (!result.isValid) {
    console.error(`❌ Validação de ${context} falhou:`, result.errors);
    throw new Error(`Dados inválidos: ${result.errors.join(', ')}`);
  }

  console.log(`✅ Validação de ${context} passou`);
  return data;
}
