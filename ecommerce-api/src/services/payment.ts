export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  clientSecret: string;
  metadata?: Record<string, string>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'paypal';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export class PaymentService {
  private paymentIntents = new Map<string, PaymentIntent>();
  private paymentMethods = new Map<string, PaymentMethod>();

  async createPaymentIntent(amount: number, currency: string = 'usd', metadata?: Record<string, string>): Promise<PaymentIntent> {
    const paymentIntent: PaymentIntent = {
      id: 'pi_' + crypto.randomUUID(),
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      status: 'requires_payment_method',
      clientSecret: 'pi_' + crypto.randomUUID() + '_secret_' + crypto.randomUUID(),
      metadata
    };

    this.paymentIntents.set(paymentIntent.id, paymentIntent);
    return paymentIntent;
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<{ success: boolean; error?: string; paymentIntent?: PaymentIntent }> {
    const paymentIntent = this.paymentIntents.get(paymentIntentId);
    
    if (!paymentIntent) {
      return { success: false, error: 'Payment intent not found' };
    }

    if (paymentIntent.status === 'succeeded') {
      return { success: false, error: 'Payment already processed' };
    }

    if (paymentIntent.status === 'canceled') {
      return { success: false, error: 'Payment was canceled' };
    }

    // Simulate payment processing
    const isSuccess = Math.random() > 0.1; // 90% success rate

    if (isSuccess) {
      paymentIntent.status = 'succeeded';
      return { success: true, paymentIntent };
    } else {
      return { success: false, error: 'Payment failed - insufficient funds or card declined' };
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
    return this.paymentIntents.get(paymentIntentId) || null;
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<{ success: boolean; error?: string }> {
    const paymentIntent = this.paymentIntents.get(paymentIntentId);
    
    if (!paymentIntent) {
      return { success: false, error: 'Payment intent not found' };
    }

    if (paymentIntent.status === 'succeeded') {
      return { success: false, error: 'Cannot cancel completed payment' };
    }

    paymentIntent.status = 'canceled';
    return { success: true };
  }

  async createPaymentMethod(type: PaymentMethod['type'], details: any): Promise<PaymentMethod> {
    const paymentMethod: PaymentMethod = {
      id: 'pm_' + crypto.randomUUID(),
      type,
      ...details
    };

    this.paymentMethods.set(paymentMethod.id, paymentMethod);
    return paymentMethod;
  }

  async getPaymentMethod(paymentMethodId: string): Promise<PaymentMethod | null> {
    return this.paymentMethods.get(paymentMethodId) || null;
  }

  // Simulate webhook events
  async simulateWebhook(paymentIntentId: string, eventType: 'payment_intent.succeeded' | 'payment_intent.payment_failed') {
    console.log(`[Payment Webhook] ${eventType} for ${paymentIntentId}`);
    
    // In a real implementation, this would trigger business logic
    // like updating order status, sending confirmation emails, etc.
    
    return {
      id: 'evt_' + crypto.randomUUID(),
      type: eventType,
      data: {
        object: await this.retrievePaymentIntent(paymentIntentId)
      },
      created: Math.floor(Date.now() / 1000)
    };
  }

  // Helper method to format amount for display
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  }

  // Calculate fees (simplified)
  calculateFees(amount: number): { stripeFee: number; applicationFee: number; netAmount: number } {
    const stripeFee = Math.round(amount * 0.029 + 30); // 2.9% + $0.30
    const applicationFee = Math.round(amount * 0.01); // 1% application fee
    const netAmount = amount - stripeFee - applicationFee;

    return { stripeFee, applicationFee, netAmount };
  }
}