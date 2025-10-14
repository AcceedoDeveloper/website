import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AssignWorkService, AssignWork } from '../../service/assignwork.service';
import { ConfigService } from '../../service/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

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
      private sanitizer: DomSanitizer
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
    const cleanFile = file.replace(/^uploads\//, '');
    const url = file.startsWith('http') ? file : this.configService.getUploadUrl(cleanFile.replace(/\\/g, '/'));
    console.log(`Generated PDF URL: ${url}`);
    return url;
  }

  getSafeFileUrl(file: string): SafeResourceUrl {
    const url = this.getFileUrl(file);
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
      if (!documentId || !fileName) return;
      if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

      const s = this.assignworkService.deleteFile(documentId, fileName).subscribe({
        next: () => {
          this.snackBar.open('File deleted successfully', 'Close', { duration: 2500 });
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
        },
        error: () => {
          this.snackBar.open('Failed to delete file', 'Close', { duration: 3000 });
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
