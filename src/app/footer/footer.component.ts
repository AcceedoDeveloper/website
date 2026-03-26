import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

  userData: any;

  isChatOpen = false;
  userInput = '';

  // ✅ Product list from your navbar
  products = [
    { name: 'Power Metrics', link: '/power-metrics' },
    { name: 'Attendance System', link: '/product2' },
    { name: 'Melting Software', link: '/melting-software' },
    { name: 'Heat Treatment', link: '/product1' },
    { name: 'Production Monitor', link: '/product-monitor' }
  ];

  // ✅ message supports text + product list
  messages: any[] = [
    { text: 'Hello 👋 Welcome to Acceedo IoT. Ask about products or services.', from: 'bot', type: 'text' }
  ];

  ngOnInit() {
    this.getCurrentUser();
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userText = this.userInput;

    this.messages.push({ text: userText, from: 'user', type: 'text' });

    this.userInput = '';

    setTimeout(() => {
      const reply = this.getBotReply(userText);

      if (reply === 'products') {
        this.messages.push({ from: 'bot', type: 'products' });
      } else {
        this.messages.push({ text: reply, from: 'bot', type: 'text' });
      }
    }, 500);
  }

  getBotReply(msg: string): any {
    msg = msg.toLowerCase();

    if (
      msg.includes('product') ||
      msg.includes('solution') ||
      msg.includes('service')
    ) return 'products';

    if (msg.includes('power'))
      return 'Power Metrics monitors machine energy & power analytics.';

    if (msg.includes('attendance'))
      return 'Industrial Attendance System with IoT & RFID integration.';

    if (msg.includes('melting'))
      return 'Melting Software tracks furnace & casting process.';

    if (msg.includes('contact'))
      return 'You can contact Acceedo, Coimbatore, Tamil Nadu.';

    if (msg.includes('hello') || msg.includes('hi'))
      return 'Hello 👋 Ask about our Industrial IoT solutions.';

    return 'Please ask about products, solutions, or services.';
  }

  getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      this.userData = JSON.parse(userStr);

      if (typeof this.userData.role === 'object' && this.userData.role?.role) {
        this.userData.role = this.userData.role.role;
      }
    }
  }
}
