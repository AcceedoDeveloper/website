import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AssignWorkService, AssignWork } from '../../../services/service/assignwork.service';
import { ConfigService } from '../../../services/service/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { FileDeleteConfirmationDialogComponent } from '../file-delete-confirmation-dialog.component';

interface Document {
  _id: string;
  title: string;
  files: string[];
}

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})

export class DocumentsComponent {
  isLoading = false;
  isDeleting = false;
  private fileUrlCache: Record<string, string> = {};
  private safeFileUrlCache: Record<string, SafeResourceUrl> = {};
  
  showmaindocument = false;
  showdocumentpop = false;
showinsummary = true;
showMonthView = false;
  showmaintask = false;
   filteredTitles: string[] = []; 
  allTitles: string[] = []; 
    editingDocument: Document | null = null;
    documentForm: FormGroup;
    documents: Document[] = [];
    filteredDocuments: Document[] = [];
    searchTerm: string = '';
    selectedFile: File | null = null;
    uploadedPictures: string[] = [];
    selectedPictureFiles: File[] = [];
    isDragOver: boolean = false;

        loadError: { [key: string]: boolean } = {}; 
  isPdfLoaded: { [key: string]: boolean } = {}; 
    opentask() {
    this.showmaintask = true;
    this.showmaindocument = false;
    this.showinsummary = false;
    this.showMonthView = false;
  }

    openuv() {
    this.showinsummary = true;
    this.showmaintask = false;
    this.showMonthView = false;
    this.showmaindocument = false;
    }

  opendoc() {
    this.showmaindocument = true;
    this.showmaintask = false;
    this.showinsummary = false;
    this.showMonthView = false;
  }

  openMonthView() {
    this.showMonthView = true;
    this.showmaintask = false;
    this.showmaindocument = false;
    this.showinsummary = false;
  }
    private subs = new Subscription();
  constructor(

      private assignworkService: AssignWorkService,
      private configService: ConfigService,
      private fb: FormBuilder,
      private snackBar: MatSnackBar,
      private http: HttpClient,
      private sanitizer: DomSanitizer,
      private dialog: MatDialog
    ){
      this.documentForm = this.fb.group({
      title: ['', Validators.required],
      file: [null]
    });
    }


    ngOnInit(): void {

    this.getDocuments();
   
  }


  getFileUrl(file: string): string {
    if (this.fileUrlCache[file]) {
      return this.fileUrlCache[file];
    }

    const cleanFile = file.replace(/^uploads\//, '');
    const url = file.startsWith('http') ? file : this.configService.getUploadUrl(cleanFile.replace(/\\/g, '/'));
    this.fileUrlCache[file] = url;
    return url;
  }

  getSafeFileUrl(file: string): SafeResourceUrl {
    if (this.safeFileUrlCache[file]) {
      return this.safeFileUrlCache[file];
    }

    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.getFileUrl(file));
    this.safeFileUrlCache[file] = safeUrl;
    return safeUrl;
  }

    opendocpop(doc?: any) {
      this.editingDocument = doc || null;
      this.showdocumentpop = true;
  
      if (doc) {
        this.documentForm.patchValue({
          title: doc.title,
          file: null
        });
        this.selectedFile = null;
      } else {
        this.documentForm.reset();
        this.selectedFile = null;
      }
    }
  
    onFileSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        this.selectedFile = input.files[0];
        this.documentForm.patchValue({ file: this.selectedFile });
      }
    }

    onDragOver(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
      this.isDragOver = true;
    }

    onDragLeave(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
      this.isDragOver = false;
    }

    onDrop(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
      this.isDragOver = false;

      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        this.selectedFile = files[0];
        this.documentForm.patchValue({ file: this.selectedFile });
      }
    }

    removeFile() {
      this.selectedFile = null;
      this.documentForm.patchValue({ file: null });
      // Reset the file input
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  
    submitDocument() {
      if (!this.documentForm.valid && !this.editingDocument) {
        this.snackBar.open('Please provide title and file', 'Close', { duration: 2500 });
        return;
      }

      this.isLoading = true;
      const formData = new FormData();
      formData.append('title', this.documentForm.get('title')?.value);
      if (this.selectedFile) {
        formData.append('files', this.selectedFile);
      }

      if (this.editingDocument && this.editingDocument._id) {
        const s = this.assignworkService.updateDocument(this.editingDocument._id, formData).subscribe({
          next: () => {
            this.isLoading = false;
            this.snackBar.open('Document updated successfully', 'Close', { duration: 2500 });
            this.getDocuments();
            setTimeout(() => {
              this.showdocumentpop = false;
            }, 300);
            this.documentForm.reset();
            this.selectedFile = null;
            this.editingDocument = null;
          },
          error: () => {
            this.isLoading = false;
            this.snackBar.open('Failed to update document', 'Close', { duration: 3000 });
          }
        });
        this.subs.add(s);
      } else {
        if (!this.selectedFile) {
          this.isLoading = false;
          this.snackBar.open('Please provide a file for new document', 'Close', { duration: 2500 });
          return;
        }
        const s = this.assignworkService.createDocument(formData).subscribe({
          next: () => {
            this.isLoading = false;
            this.snackBar.open('Document uploaded successfully', 'Close', { duration: 2500 });
            this.getDocuments();
            setTimeout(() => {
              this.showdocumentpop = false;
            }, 300);
            this.documentForm.reset();
            this.selectedFile = null;
          },
          error: () => {
            this.isLoading = false;
            this.snackBar.open('Failed to upload document', 'Close', { duration: 3000 });
          }
        });
        this.subs.add(s);
      }
    }
  
    getDocuments() {
      const s = this.assignworkService.getDocument().subscribe({
        next: (res) => {
          this.fileUrlCache = {};
          this.safeFileUrlCache = {};
          if (Array.isArray(res)) {
            this.documents = res;
          } else if (res?.data && Array.isArray(res.data)) {
            this.documents = res.data;
          } else {
            this.documents = [];
          }
          this.filteredDocuments = [...this.documents];
          // Populate allTitles with unique document titles
          this.allTitles = [...new Set(this.documents.map(doc => doc.title))];
          this.filteredTitles = [...this.allTitles];
        },
        error: () => {
          this.fileUrlCache = {};
          this.safeFileUrlCache = {};
          this.snackBar.open('Failed to load documents', 'Close', { duration: 3000 });
          this.documents = [];
          this.filteredDocuments = [];
          this.allTitles = [];
          this.filteredTitles = [];
        }
      });
      this.subs.add(s);
    }
  
    filterDocuments() {
      if (!this.searchTerm) {
        this.filteredDocuments = [...this.documents];
        return;
      }
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredDocuments = this.documents.filter(doc =>
        doc.title.toLowerCase().includes(searchLower)
      );
    }
  
    filterTitles() {
      const filterValue = this.documentForm.get('title')?.value?.toLowerCase() || '';
      this.filteredTitles = this.allTitles.filter(title =>
        title.toLowerCase().includes(filterValue)
      );
    }
  
    onTitleSelected(event: any) {
      const selectedTitle = event.option.value;
      this.documentForm.get('title')?.setValue(selectedTitle);
      const selectedDoc = this.documents.find(doc => doc.title === selectedTitle);
      if (selectedDoc) {
        this.editingDocument = selectedDoc;
        this.documentForm.patchValue({
          title: selectedDoc.title,
          file: null
        });
        this.selectedFile = null;
      }
    }
  
    deleteDocument(id: string) {
      if (!id) return;
      if (!confirm('Are you sure you want to delete this document?')) return;

      const s = this.assignworkService.deleteDocument(id).subscribe({
        next: () => {
          this.snackBar.open('Document deleted successfully', 'Close', { duration: 2500 });
          this.documents = this.documents.filter(doc => String(doc._id) !== String(id));
          this.filterDocuments();
          this.allTitles = [...new Set(this.documents.map(doc => doc.title))];
          this.filteredTitles = [...this.allTitles];
        },
        error: () => {
          this.snackBar.open('Failed to delete document', 'Close', { duration: 3000 });
        }
      });
      this.subs.add(s);
    }

    deleteFile(documentId: string, fileName: string) {
    if (!documentId || !fileName) {
      console.error('Invalid document ID or file name:', { documentId, fileName });
      this.snackBar.open('Invalid document ID or file name provided', 'Close', { duration: 3000 });
      return;
    }

    // Check if file has any dependencies
    this.checkFileDependencies(documentId, fileName).then((hasDependencies) => {
      if (hasDependencies) {
        this.snackBar.open('Cannot delete file: It is referenced by other documents or tasks', 'Close', { duration: 5000 });
        return;
      }

      // Use Material Dialog for confirmation
      const dialogRef = this.dialog.open(FileDeleteConfirmationDialogComponent, {
        width: '400px',
        height: 'auto',
        data: { 
          mode: 'delete',
          documentId: documentId,
          fileName: fileName,
          title: 'Confirm File Deletion',
          message: `Are you sure you want to delete "${fileName}"? This action cannot be undone and will permanently remove the file.`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'confirm') {
          this.performFileDeletion(documentId, fileName);
        }
      });
    }).catch((error) => {
      console.error('Error checking file dependencies:', error);
      this.snackBar.open('Error checking file dependencies', 'Close', { duration: 3000 });
    });
  }

  private async checkFileDependencies(documentId: string, fileName: string): Promise<boolean> {
    try {
      // Check if file has any dependencies
      // This is a placeholder - you would implement actual dependency checks based on your business logic
      // For example, check if file is referenced by other documents, tasks, comments, etc.
      return false; // For now, allow deletion
    } catch (error) {
      console.error('Error fetching file dependencies:', error);
      return false; // Allow deletion if check fails
    }
  }

  private performFileDeletion(documentId: string, fileName: string): void {
    this.isDeleting = true;
    
    const s = this.assignworkService.deleteFile(documentId, fileName).subscribe({
      next: () => {
        console.log('File deleted successfully:', fileName);
        this.snackBar.open('File deleted successfully', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        // Update the document by removing the deleted file
        const docIndex = this.documents.findIndex(doc => String(doc._id) === String(documentId));
        if (docIndex !== -1) {
          this.documents[docIndex].files = this.documents[docIndex].files.filter(file => file !== fileName);
          // If no files left, remove the entire document
          if (this.documents[docIndex].files.length === 0) {
            this.documents.splice(docIndex, 1);
            this.allTitles = [...new Set(this.documents.map(doc => doc.title))];
            this.filteredTitles = [...this.allTitles];
          }
          this.filterDocuments();
        }
        this.isDeleting = false;
      },
      error: (err) => {
        console.error('Delete operation failed:', err);
        
        let errorMessage = 'Failed to delete file';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.status === 404) {
          errorMessage = 'File not found';
        } else if (err.status === 403) {
          errorMessage = 'You do not have permission to delete this file';
        } else if (err.status === 409) {
          errorMessage = 'Cannot delete file: It is referenced by other documents or tasks';
        } else if (err.status === 0) {
          errorMessage = 'Network error: Please check your connection';
        }
        
        this.snackBar.open(errorMessage, 'Close', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isDeleting = false;
      }
    });
    this.subs.add(s);
  }

      getFileType(file: string): string {
    const extension = file.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return 'pdf';
    } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(extension || '')) {
      return 'image';
    } else if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return 'excel';
    }
    return 'other';
  }

  onPdfLoad(file: string) {
    console.log(`PDF loaded successfully: ${file}`);
    this.isPdfLoaded[file] = true;
    this.loadError[file] = false;
  }

  onPdfError(file: string, error: any) {
    console.error(`PDF load error for ${file}:`, error);
    this.isPdfLoaded[file] = false;
    this.loadError[file] = true;
  }
  
}
