import { Component } from '@angular/core';

@Component({
  selector: 'app-product5',
  templateUrl: './product5.component.html',
  styleUrl: './product5.component.css'
})
export class Product5Component {

  openImage(event: any): void {
  const modal = document.getElementById("imageModal") as HTMLElement;
  const fullImage = document.getElementById("fullImage") as HTMLImageElement;

  modal.style.display = "flex";
  fullImage.src = event.target.src;
}

closeImage(): void {
  const modal = document.getElementById("imageModal") as HTMLElement;
  modal.style.display = "none";
}

}
