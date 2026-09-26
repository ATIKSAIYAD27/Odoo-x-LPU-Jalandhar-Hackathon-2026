export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'alert' | 'info';
  duration?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

class ToastService {
  private toasts: ToastMessage[] = [];
  private listeners: ToastListener[] = [];

  public subscribe(listener: ToastListener): () => void {
    this.listeners.push(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.toasts]));
  }

  public show(toast: Omit<ToastMessage, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { ...toast, id };
    this.toasts.push(newToast);
    this.notify();

    const duration = toast.duration || 4000;
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  public success(title: string, message: string) {
    this.show({ title, message, type: 'success' });
  }

  public warning(title: string, message: string) {
    this.show({ title, message, type: 'warning' });
  }

  public alert(title: string, message: string) {
    this.show({ title, message, type: 'alert' });
  }

  public info(title: string, message: string) {
    this.show({ title, message, type: 'info' });
  }

  public remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }
}

export const toastService = new ToastService();
