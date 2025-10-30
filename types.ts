export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface MenuItem {
    name: string;
    description: string;
}

export interface Hours {
    days: string;
    time: string;
}

export interface BusinessData {
    concept: string;
    signatureDrinks: MenuItem[];
    menuDescription: string;
    beans: string;
    openingHours: Hours[];
    location: string;
    amenities: string;
    events: string;
}
