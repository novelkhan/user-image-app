import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserService } from 'src/app/services/user.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  userForm!: FormGroup;
  isEdit: boolean = false;
  userId: number | null = null;
  existingFiles: any[] = [];
  newFiles: any[] = [];
  removedImages: string[] = [];
  showPreviewModal: boolean = false;
  currentPreview: any = null;
  clickedElementPosition: DOMRect | null = null;
  isAnimating: boolean = false;

  constructor(
    private fb: FormBuilder,
    public service: UserService, // private থেকে public করা হলো
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      photos: [null]
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.userId = +params['id'];
        this.loadUser(this.userId);
      }
    });
  }

  async loadUser(id: number) {
    this.service.getUserById(id).subscribe(async (user) => {
      this.userForm.patchValue({
        name: user.name,
        email: user.email
      });
      this.existingFiles = [];
      for (const photo of user.photos) {
        const fileUrl = `${this.service.baseUrl}/users/download/${photo.id}`;
        const ext = this.getFileExtension(photo.originalName).toLowerCase();
        const file = {
          ...photo,
          fileSize: await this.getFileSize(fileUrl),
          safeUrl: ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext)
            ? this.sanitizer.bypassSecurityTrustResourceUrl(
                // `${this.service.baseUrl}/users/preview/${photo.id}${ext === 'pdf' ? '#zoom=50' : ''}`
                `${this.service.baseUrl}/users/preview/${photo.id}`
              )
            : this.sanitizer.bypassSecurityTrustResourceUrl('')
        };
        this.existingFiles.push(file);
      }
    });
  }

  onFileChange(event: any) {
    const files = Array.from(event.target.files) as File[];
    const newFilesToAdd = files.map(file => ({
      file,
      name: file.name, // file.originalName এর পরিবর্তে file.name
      fileSize: this.formatFileSize(file.size),
      safeUrl: this.getSafeUrl(file)
    }));
    this.newFiles = [...this.newFiles, ...newFilesToAdd];
  }

  getSafeUrl(file: File): SafeResourceUrl {
    const ext = this.getFileExtension(file.name).toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
    } else if (ext === 'pdf') {
      // return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file) + '#zoom=50');
      return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl('');
  }

  openPreview(event: MouseEvent, file: any) {
    const clickedElement = event.currentTarget as HTMLElement;
    this.clickedElementPosition = clickedElement.getBoundingClientRect();
    this.currentPreview = { ...file }; // shallow copy

    const ext = this.getFileExtension(file.name || file.originalName).toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      const fileUrl = file.file
        ? URL.createObjectURL(file.file)
        : `${this.service.baseUrl}/users/preview/${file.id}`;
      this.currentPreview.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    } else if (ext === 'pdf') {
      const fileUrl = file.file
        ? URL.createObjectURL(file.file) + '#zoom=100'
        : `${this.service.baseUrl}/users/preview/${file.id}#zoom=100`;
      this.currentPreview.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    } else {
      this.currentPreview.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl('');
    }

    this.isAnimating = true;
    this.showPreviewModal = true;

    setTimeout(() => {
      this.isAnimating = false;
    }, 800);
  }

  closePreview() {
    this.isAnimating = true;
    setTimeout(() => {
      this.showPreviewModal = false;
      this.currentPreview = null;
      this.clickedElementPosition = null;
      this.isAnimating = false;
    }, 800);
  }

  removeExistingImage(index: number) {
    const image = this.existingFiles[index];
    this.removedImages.push(image.id);
    this.existingFiles.splice(index, 1);
  }

  removeNewImage(index: number) {
    this.newFiles.splice(index, 1);
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.toastr.error('Please fill all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('name', this.userForm.get('name')?.value);
    formData.append('email', this.userForm.get('email')?.value);

    for (const file of this.newFiles) {
      formData.append('photos', file.file);
    }

    for (const id of this.removedImages) {
      formData.append('removedImages[]', id);
    }

    if (this.isEdit && this.userId) {
      this.service.updateUser(this.userId, formData).subscribe({
        next: () => {
          this.toastr.success('User updated!');
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.toastr.error('Failed to update user');
          console.error(err);
        }
      });
    } else {
      this.service.createUser(formData).subscribe({
        next: () => {
          this.toastr.success('User created!');
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.toastr.error('Failed to create user');
          console.error(err);
        }
      });
    }
  }

  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  getFileSize(fileUrl: string): Promise<string> {
    return fetch(fileUrl, { method: 'HEAD' })
      .then((response) => {
        const size = Number(response.headers.get('Content-Length'));
        if (!size) return 'Unknown size';
        const kb = size / 1024;
        return kb > 1024 ? (kb / 1024).toFixed(2) + ' MB' : kb.toFixed(2) + ' KB';
      })
      .catch(() => 'Unknown size');
  }

  formatFileSize(size: number): string {
    if (!size) return 'Unknown size';
    const kb = size / 1024;
    return kb > 1024 ? (kb / 1024).toFixed(2) + ' MB' : kb.toFixed(2) + ' KB';
  }
}