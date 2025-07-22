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

  constructor(
    private fb: FormBuilder,
    private service: UserService,
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

  loadUser(id: number) {
    this.service.getUserById(id).subscribe(user => {
      this.userForm.patchValue({
        name: user.name,
        email: user.email
      });
      this.existingFiles = user.photos.map((photo: any) => ({
        ...photo,
        safeUrl: this.getPreviewUrl(photo)
      }));
    });
  }

  onFileChange(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.newFiles = files.map(file => ({
      file,
      name: file.name,
      safeUrl: this.getSafeUrl(file)
    }));
  }

  getSafeUrl(file: File): SafeResourceUrl {
    const ext = this.getFileExtension(file.name);
    if (ext === 'pdf') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
  }

  getPreviewUrl(photo: any): SafeResourceUrl {
    const ext = this.getFileExtension(photo.originalName);
    if (ext === 'pdf') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `${this.service.baseUrl}/users/preview/${photo.id}`
      );
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `${this.service.baseUrl}/users/preview/${photo.id}`
    );
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
}