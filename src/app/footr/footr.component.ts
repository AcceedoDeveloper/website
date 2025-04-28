import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-footr',
  templateUrl: './footr.component.html',
  styleUrl: './footr.component.css'
})
export class FootrComponent {
  isDropdownOpen = false;
  isNavOpen = false;

  toggleDropdown(event: Event) {
    event.preventDefault();
    console.log('Dropdown toggle clicked, current state:', this.isDropdownOpen);
    this.isDropdownOpen = !this.isDropdownOpen;
    console.log('Dropdown toggle new state:', this.isDropdownOpen);
  }

  onNavCheckChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.isNavOpen = target.checked;
    console.log('Hamburger menu toggled, nav open:', this.isNavOpen);
    if (!this.isNavOpen) {
      this.isDropdownOpen = false; // Close dropdown when hamburger menu closes
      console.log('Dropdown closed due to hamburger menu closing');
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown') && this.isDropdownOpen) {
      this.isDropdownOpen = false;
      console.log('Dropdown closed due to outside click');
    }
  }
}
