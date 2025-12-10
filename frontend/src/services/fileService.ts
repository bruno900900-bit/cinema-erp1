// Serviço de gerenciamento de arquivos por projeto

export interface ProjectFile {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  created_at: Date;
  modified_at: Date;
  path: string;
  parent_id?: string;
  children?: ProjectFile[];
  file_type?: 'contract' | 'location' | 'document' | 'image' | 'other';
  status?: 'approved' | 'pending' | 'draft';
  project_id?: number;
  location_id?: number;
  contract_id?: string;
  url?: string;
  mime_type?: string;
}

export interface ProjectFolder {
  id: string;
  name: string;
  project_id: number;
  project_name: string;
  project_status: string;
  project_budget: number;
  project_responsible: string;
  created_at: Date;
  files: ProjectFile[];
  locations: any[];
  contracts: any[];
}

export interface UploadResult {
  success: boolean;
  file?: ProjectFile;
  error?: string;
}

export interface FileSearchParams {
  project_id?: number;
  file_type?: string;
  status?: string;
  search?: string;
}

class FileService {
  private projectFolders: ProjectFolder[] = [];

  /**
   * Obtém todos os projetos com suas estruturas de arquivos
   */
  async getProjectFolders(): Promise<ProjectFolder[]> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.projectFolders;
  }

  /**
   * Obtém arquivos de um projeto específico
   */
  async getProjectFiles(projectId: number, path: string = ''): Promise<ProjectFile[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const project = this.projectFolders.find(p => p.project_id === projectId);
    if (!project) return [];

    if (!path) {
      return project.files;
    }

    // Navegar pela estrutura de pastas
    const pathParts = path.split('/').filter(p => p);
    let currentFiles = project.files;

    for (const part of pathParts) {
      const folder = currentFiles.find(f => f.name === part && f.type === 'folder');
      if (folder && folder.children) {
        currentFiles = folder.children;
      } else {
        return [];
      }
    }

    return currentFiles;
  }

  /**
   * Cria uma nova pasta
   */
  async createFolder(
    projectId: number,
    name: string,
    parentPath: string = ''
  ): Promise<ProjectFile> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const newFolder: ProjectFile = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: 'folder',
      created_at: new Date(),
      modified_at: new Date(),
      path: parentPath ? `${parentPath}/${name}` : name,
      project_id: projectId,
      children: [],
    };

    // Adicionar à estrutura de pastas
    const project = this.projectFolders.find(p => p.project_id === projectId);
    if (project) {
      if (!parentPath) {
        project.files.push(newFolder);
      } else {
        // Encontrar pasta pai e adicionar
        const parentFolder = this.findFolderByPath(project.files, parentPath);
        if (parentFolder) {
          parentFolder.children = parentFolder.children || [];
          parentFolder.children.push(newFolder);
        }
      }
    }

    return newFolder;
  }

  /**
   * Faz upload de um arquivo
   */
  async uploadFile(
    projectId: number,
    file: File,
    parentPath: string = ''
  ): Promise<UploadResult> {
    try {
      // Simular upload
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newFile: ProjectFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: 'file',
        size: file.size,
        created_at: new Date(),
        modified_at: new Date(),
        path: parentPath ? `${parentPath}/${file.name}` : file.name,
        project_id: projectId,
        mime_type: file.type,
        file_type: this.getFileTypeFromMime(file.type),
        status: 'pending',
        url: URL.createObjectURL(file), // Simular URL do arquivo
      };

      // Adicionar à estrutura de pastas
      const project = this.projectFolders.find(p => p.project_id === projectId);
      if (project) {
        if (!parentPath) {
          project.files.push(newFile);
        } else {
          const parentFolder = this.findFolderByPath(project.files, parentPath);
          if (parentFolder) {
            parentFolder.children = parentFolder.children || [];
            parentFolder.children.push(newFile);
          }
        }
      }

      return {
        success: true,
        file: newFile,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao fazer upload do arquivo',
      };
    }
  }

  /**
   * Remove um arquivo ou pasta
   */
  async deleteFile(projectId: number, fileId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const project = this.projectFolders.find(p => p.project_id === projectId);
    if (!project) return false;

    // Remover da estrutura
    this.removeFileFromStructure(project.files, fileId);
    return true;
  }

  /**
   * Renomeia um arquivo ou pasta
   */
  async renameFile(
    projectId: number,
    fileId: string,
    newName: string
  ): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const project = this.projectFolders.find(p => p.project_id === projectId);
    if (!project) return false;

    const file = this.findFileById(project.files, fileId);
    if (file) {
      file.name = newName;
      file.modified_at = new Date();
      return true;
    }

    return false;
  }

  /**
   * Move um arquivo para outra pasta
   */
  async moveFile(
    projectId: number,
    fileId: string,
    newParentPath: string
  ): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const project = this.projectFolders.find(p => p.project_id === projectId);
    if (!project) return false;

    const file = this.findFileById(project.files, fileId);
    if (!file) return false;

    // Remover da localização atual
    this.removeFileFromStructure(project.files, fileId);

    // Adicionar à nova localização
    if (!newParentPath) {
      project.files.push(file);
    } else {
      const parentFolder = this.findFolderByPath(project.files, newParentPath);
      if (parentFolder) {
        parentFolder.children = parentFolder.children || [];
        parentFolder.children.push(file);
      }
    }

    file.path = newParentPath ? `${newParentPath}/${file.name}` : file.name;
    file.modified_at = new Date();

    return true;
  }

  /**
   * Busca arquivos
   */
  async searchFiles(params: FileSearchParams): Promise<ProjectFile[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    let results: ProjectFile[] = [];

    // Filtrar por projeto
    const projects = params.project_id
      ? this.projectFolders.filter(p => p.project_id === params.project_id)
      : this.projectFolders;

    // Coletar todos os arquivos
    projects.forEach(project => {
      results = results.concat(this.getAllFiles(project.files));
    });

    // Aplicar filtros
    if (params.file_type) {
      results = results.filter(f => f.file_type === params.file_type);
    }

    if (params.status) {
      results = results.filter(f => f.status === params.status);
    }

    if (params.search) {
      const search = params.search.toLowerCase();
      results = results.filter(f =>
        f.name.toLowerCase().includes(search) ||
        f.path.toLowerCase().includes(search)
      );
    }

    return results;
  }

  /**
   * Obtém estatísticas de arquivos por projeto
   */
  async getProjectFileStats(projectId: number): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    filesByStatus: Record<string, number>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const project = this.projectFolders.find(p => p.project_id === projectId);
    if (!project) {
      return {
        totalFiles: 0,
        totalSize: 0,
        filesByType: {},
        filesByStatus: {},
      };
    }

    const allFiles = this.getAllFiles(project.files);
    const totalSize = allFiles.reduce((sum, file) => sum + (file.size || 0), 0);

    const filesByType: Record<string, number> = {};
    const filesByStatus: Record<string, number> = {};

    allFiles.forEach(file => {
      if (file.type === 'file') {
        // Por tipo
        const type = file.file_type || 'other';
        filesByType[type] = (filesByType[type] || 0) + 1;

        // Por status
        const status = file.status || 'draft';
        filesByStatus[status] = (filesByStatus[status] || 0) + 1;
      }
    });

    return {
      totalFiles: allFiles.filter(f => f.type === 'file').length,
      totalSize,
      filesByType,
      filesByStatus,
    };
  }

  /**
   * Inicializa dados de exemplo
   */
  initializeSampleData(projects: any[], users: any[]): void {
    this.projectFolders = projects.map(project => {
      const projectFiles: ProjectFile[] = [
        {
          id: `folder_${project.id}_locations`,
          name: 'Locações',
          type: 'folder',
          created_at: new Date(),
          modified_at: new Date(),
          path: `/projects/${project.id}/locations`,
          project_id: project.id,
          children: [
            {
              id: `location_${project.id}_001`,
              name: 'Casa de Luxo - Jardins',
              type: 'file',
              size: 1024,
              created_at: new Date(),
              modified_at: new Date(),
              path: `/projects/${project.id}/locations/casa_luxo_jardins.pdf`,
              parent_id: `folder_${project.id}_locations`,
              file_type: 'location',
              status: 'approved',
              project_id: project.id,
              location_id: 1,
              mime_type: 'application/pdf',
            },
            {
              id: `location_${project.id}_002`,
              name: 'Apartamento - Vila Madalena',
              type: 'file',
              size: 2048,
              created_at: new Date(),
              modified_at: new Date(),
              path: `/projects/${project.id}/locations/apartamento_vila_madalena.pdf`,
              parent_id: `folder_${project.id}_locations`,
              file_type: 'location',
              status: 'approved',
              project_id: project.id,
              location_id: 2,
              mime_type: 'application/pdf',
            },
          ],
        },
        {
          id: `folder_${project.id}_contracts`,
          name: 'Contratos',
          type: 'folder',
          created_at: new Date(),
          modified_at: new Date(),
          path: `/projects/${project.id}/contracts`,
          project_id: project.id,
          children: [
            {
              id: `contract_${project.id}_001`,
              name: `Contrato de Locação - ${project.title}`,
              type: 'file',
              size: 5120,
              created_at: new Date(),
              modified_at: new Date(),
              path: `/projects/${project.id}/contracts/contrato_locacao.pdf`,
              parent_id: `folder_${project.id}_contracts`,
              file_type: 'contract',
              status: 'approved',
              project_id: project.id,
              contract_id: `CONTRACT_${project.id}_001`,
              mime_type: 'application/pdf',
            },
            {
              id: `contract_${project.id}_002`,
              name: `Contrato de Equipamentos - ${project.title}`,
              type: 'file',
              size: 4096,
              created_at: new Date(),
              modified_at: new Date(),
              path: `/projects/${project.id}/contracts/contrato_equipamentos.pdf`,
              parent_id: `folder_${project.id}_contracts`,
              file_type: 'contract',
              status: 'approved',
              project_id: project.id,
              contract_id: `CONTRACT_${project.id}_002`,
              mime_type: 'application/pdf',
            },
          ],
        },
        {
          id: `folder_${project.id}_documents`,
          name: 'Documentos',
          type: 'folder',
          created_at: new Date(),
          modified_at: new Date(),
          path: `/projects/${project.id}/documents`,
          project_id: project.id,
          children: [
            {
              id: `doc_${project.id}_001`,
              name: 'Cronograma de Produção',
              type: 'file',
              size: 1536,
              created_at: new Date(),
              modified_at: new Date(),
              path: `/projects/${project.id}/documents/cronograma_producao.pdf`,
              parent_id: `folder_${project.id}_documents`,
              file_type: 'document',
              status: 'approved',
              project_id: project.id,
              mime_type: 'application/pdf',
            },
            {
              id: `doc_${project.id}_002`,
              name: 'Orçamento Detalhado',
              type: 'file',
              size: 3072,
              created_at: new Date(),
              modified_at: new Date(),
              path: `/projects/${project.id}/documents/orcamento_detalhado.pdf`,
              parent_id: `folder_${project.id}_documents`,
              file_type: 'document',
              status: 'approved',
              project_id: project.id,
              mime_type: 'application/pdf',
            },
          ],
        },
      ];

      return {
        id: `project_${project.id}`,
        name: project.title,
        project_id: project.id,
        project_name: project.title,
        project_status: project.status,
        project_budget: project.budget || 0,
        project_responsible: users.find(u => u.id === project.responsibleUserId)?.full_name || 'N/A',
        created_at: new Date(),
        files: projectFiles,
        locations: [],
        contracts: [],
      };
    });
  }

  // Métodos auxiliares privados
  private getFileTypeFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('contract')) return 'contract';
    if (mimeType.includes('location')) return 'location';
    return 'other';
  }

  private findFolderByPath(files: ProjectFile[], path: string): ProjectFile | null {
    const pathParts = path.split('/').filter(p => p);
    let currentFiles = files;

    for (const part of pathParts) {
      const folder = currentFiles.find(f => f.name === part && f.type === 'folder');
      if (folder && folder.children) {
        currentFiles = folder.children;
      } else {
        return null;
      }
    }

    return currentFiles.find(f => f.type === 'folder') || null;
  }

  private findFileById(files: ProjectFile[], id: string): ProjectFile | null {
    for (const file of files) {
      if (file.id === id) return file;
      if (file.children) {
        const found = this.findFileById(file.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  private removeFileFromStructure(files: ProjectFile[], id: string): boolean {
    for (let i = 0; i < files.length; i++) {
      if (files[i].id === id) {
        files.splice(i, 1);
        return true;
      }
      if (files[i].children) {
        if (this.removeFileFromStructure(files[i].children!, id)) {
          return true;
        }
      }
    }
    return false;
  }

  private getAllFiles(files: ProjectFile[]): ProjectFile[] {
    let result: ProjectFile[] = [];
    files.forEach(file => {
      result.push(file);
      if (file.children) {
        result = result.concat(this.getAllFiles(file.children));
      }
    });
    return result;
  }
}

export const fileService = new FileService();














































