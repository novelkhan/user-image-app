import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  showPreviewModal: boolean = false;
  currentPreview: any = null;
  clickedElementPosition: DOMRect | null = null;
  isAnimating: boolean = false;

  constructor(
    public service: UserService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  async loadUsers() {
    this.service.getAllUsers().subscribe(async (res) => {
      this.users = res;

      for (const user of this.users) {
        for (const photo of user.photos) {
          const fileUrl = `${this.service.baseUrl}/users/download/${photo.id}`;
          photo.fileSize = await this.getFileSize(fileUrl);

          // ফাইলের প্রিভিউ URL সেট করা
          const ext = this.getFileExtension(photo.originalName).toLowerCase();
          if (['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext)) {
            // const previewUrl = `${this.service.baseUrl}/users/preview/${photo.id}${ext === 'pdf' ? '#zoom=50' : ''}`;
            const previewUrl = `${this.service.baseUrl}/users/preview/${photo.id}`;
            photo.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(previewUrl);
          } else {
            // অন্য ফাইলের জন্য খালি safeUrl
            photo.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl('');
          }
        }
      }
    });
  }

  openPreview(event: MouseEvent, photo: any) {
    const clickedElement = event.currentTarget as HTMLElement;
    this.clickedElementPosition = clickedElement.getBoundingClientRect();
    this.currentPreview = { ...photo }; // shallow copy

    const ext = this.getFileExtension(photo.originalName).toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext)) {
      const fileUrl = `${this.service.baseUrl}/users/preview/${photo.id}${ext === 'pdf' ? '#zoom=100' : ''}`;
      this.currentPreview.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    } else {
      // অন্য ফাইলের জন্য খালি safeUrl
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
    }, 800); // অ্যানিমেশন শেষ হওয়া পর্যন্ত অপেক্ষা
  }

  deleteUser(id: number) {
    if (confirm('Are you sure?')) {
      this.service.deleteUser(id).subscribe(() => {
        this.toastr.success('Deleted!');
        this.loadUsers();
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

  downloadFile(photoId: string, originalName: string) {
    const fileUrl = `${this.service.baseUrl}/users/download/${photoId}`;
    fetch(fileUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = originalName;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((error) => {
        console.error('Download error:', error);
        alert('Failed to download file.');
      });
  }
}