import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  users: any[] = [];

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
          const fileUrl = `${this.service.baseUrl}/${photo.url}`;
          photo.fileSize = await this.getFileSize(fileUrl);

          if (this.getFileExtension(photo.originalName) === 'pdf') {
            photo.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
          }
        }
      }
    });
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

  downloadFile(storedName: string, originalName: string) {
    const fileUrl = `${this.service.baseUrl}/${storedName}`;
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