export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      booking_accommodations: {
        Row: {
          address: string | null
          amenities: string[] | null
          booking_id: string
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          hotel_name: string
          id: string
          notes: string | null
          room_type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          booking_id: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          hotel_name: string
          id?: string
          notes?: string | null
          room_type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          booking_id?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          hotel_name?: string
          id?: string
          notes?: string | null
          room_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_accommodations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_activity_log: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          metadata: Json | null
          trip_booking_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          metadata?: Json | null
          trip_booking_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          trip_booking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_activity_log_trip_booking_id_fkey"
            columns: ["trip_booking_id"]
            isOneToOne: false
            referencedRelation: "trip_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_attachments: {
        Row: {
          booking_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_attachments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_flights: {
        Row: {
          airline: string | null
          arrival_city: string
          arrival_time: string
          booking_id: string
          created_at: string
          departure_city: string
          departure_time: string
          flight_number: string | null
          id: string
          updated_at: string
        }
        Insert: {
          airline?: string | null
          arrival_city: string
          arrival_time: string
          booking_id: string
          created_at?: string
          departure_city: string
          departure_time: string
          flight_number?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          airline?: string | null
          arrival_city?: string
          arrival_time?: string
          booking_id?: string
          created_at?: string
          departure_city?: string
          departure_time?: string
          flight_number?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_flights_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          destination_id: string
          guests: number
          id: string
          status: string
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          destination_id: string
          guests?: number
          id?: string
          status?: string
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          destination_id?: string
          guests?: number
          id?: string
          status?: string
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          country: string
          created_at: string
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          name: string
          price_from: number
          rating: number | null
        }
        Insert: {
          country: string
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name: string
          price_from: number
          rating?: number | null
        }
        Update: {
          country?: string
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name?: string
          price_from?: number
          rating?: number | null
        }
        Relationships: []
      }
      discount_code_uses: {
        Row: {
          discount_code_id: string
          email: string
          id: string
          trip_booking_id: string | null
          used_at: string
        }
        Insert: {
          discount_code_id: string
          email: string
          id?: string
          trip_booking_id?: string | null
          used_at?: string
        }
        Update: {
          discount_code_id?: string
          email?: string
          id?: string
          trip_booking_id?: string | null
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_uses_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_uses_trip_booking_id_fkey"
            columns: ["trip_booking_id"]
            isOneToOne: false
            referencedRelation: "trip_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          allowed_email: string | null
          code: string
          created_at: string
          created_by: string
          current_uses: number
          discount_amount: number | null
          discount_percent: number | null
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          allowed_email?: string | null
          code: string
          created_at?: string
          created_by: string
          current_uses?: number
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          allowed_email?: string | null
          code?: string
          created_at?: string
          created_by?: string
          current_uses?: number
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_text: string
          button_text: string
          footer_text: string
          heading: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          primary_color: string
          subject: string
          template_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_text?: string
          button_text?: string
          footer_text?: string
          heading?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          primary_color?: string
          subject: string
          template_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_text?: string
          button_text?: string
          footer_text?: string
          heading?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string
          subject?: string
          template_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      listing_availability: {
        Row: {
          created_at: string
          id: string
          is_blocked: boolean
          listing_id: string
          price_per_week: number
          updated_at: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_blocked?: boolean
          listing_id: string
          price_per_week: number
          updated_at?: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          is_blocked?: boolean
          listing_id?: string
          price_per_week?: number
          updated_at?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_availability_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "partner_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_bookings: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string | null
          phone: string
          school: string
          slot_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message?: string | null
          phone: string
          school: string
          slot_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string | null
          phone?: string
          school?: string
          slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "meeting_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_slots: {
        Row: {
          created_at: string
          created_by: string
          end_time: string
          id: string
          is_booked: boolean
          meet_link: string | null
          slot_date: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_time: string
          id?: string
          is_booked?: boolean
          meet_link?: string | null
          slot_date: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_time?: string
          id?: string
          is_booked?: boolean
          meet_link?: string | null
          slot_date?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_listings: {
        Row: {
          access_type: string | null
          address: string | null
          bathrooms: number | null
          beds: number | null
          capacity: number
          country: string
          created_at: string
          daily_price: number | null
          description: string | null
          destination: string
          facilities: string[] | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          name: string
          partner_id: string
          property_type: string | null
          rooms: number | null
          size_sqm: number | null
          status: string
          updated_at: string
        }
        Insert: {
          access_type?: string | null
          address?: string | null
          bathrooms?: number | null
          beds?: number | null
          capacity?: number
          country: string
          created_at?: string
          daily_price?: number | null
          description?: string | null
          destination: string
          facilities?: string[] | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          name: string
          partner_id: string
          property_type?: string | null
          rooms?: number | null
          size_sqm?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          access_type?: string | null
          address?: string | null
          bathrooms?: number | null
          beds?: number | null
          capacity?: number
          country?: string
          created_at?: string
          daily_price?: number | null
          description?: string | null
          destination?: string
          facilities?: string[] | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          name?: string
          partner_id?: string
          property_type?: string | null
          rooms?: number | null
          size_sqm?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_listings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payouts: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          listing_id: string | null
          notes: string | null
          partner_id: string
          payout_date: string
          period_end: string | null
          period_start: string | null
          reference: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          listing_id?: string | null
          notes?: string | null
          partner_id: string
          payout_date: string
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          listing_id?: string | null
          notes?: string | null
          partner_id?: string
          payout_date?: string
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_payouts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "partner_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          address: string
          bank_address: string | null
          bank_name: string | null
          certifies_company_authority: boolean
          certifies_local_taxes: boolean
          certifies_rental_rights: boolean
          city: string
          company_name: string | null
          contact_person: string | null
          country: string
          created_at: string
          currency: string | null
          email: string
          first_name: string | null
          iban: string | null
          id: string
          last_name: string | null
          locale: string
          organization_number: string | null
          partner_type: string
          personal_id: string | null
          phone: string
          status: string
          swift: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          bank_address?: string | null
          bank_name?: string | null
          certifies_company_authority?: boolean
          certifies_local_taxes?: boolean
          certifies_rental_rights?: boolean
          city: string
          company_name?: string | null
          contact_person?: string | null
          country: string
          created_at?: string
          currency?: string | null
          email: string
          first_name?: string | null
          iban?: string | null
          id?: string
          last_name?: string | null
          locale?: string
          organization_number?: string | null
          partner_type: string
          personal_id?: string | null
          phone: string
          status?: string
          swift?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          bank_address?: string | null
          bank_name?: string | null
          certifies_company_authority?: boolean
          certifies_local_taxes?: boolean
          certifies_rental_rights?: boolean
          city?: string
          company_name?: string | null
          contact_person?: string | null
          country?: string
          created_at?: string
          currency?: string | null
          email?: string
          first_name?: string | null
          iban?: string | null
          id?: string
          last_name?: string | null
          locale?: string
          organization_number?: string | null
          partner_type?: string
          personal_id?: string | null
          phone?: string
          status?: string
          swift?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          partner_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          partner_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_status_history_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          payment_provider: string | null
          payment_type: string
          provider_session_id: string | null
          provider_transaction_id: string | null
          status: string
          trip_booking_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          payment_type: string
          provider_session_id?: string | null
          provider_transaction_id?: string | null
          status?: string
          trip_booking_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          payment_type?: string
          provider_session_id?: string | null
          provider_transaction_id?: string | null
          status?: string
          trip_booking_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_trip_booking_id_fkey"
            columns: ["trip_booking_id"]
            isOneToOne: false
            referencedRelation: "trip_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_trip_bookings: {
        Row: {
          booking_data: Json
          booking_fee_amount: number
          booking_id: string | null
          created_at: string
          discount_amount: number | null
          discount_code: string | null
          duffel_offer_data: Json | null
          duffel_offer_id: string | null
          expires_at: string
          flight_price_sek: number | null
          id: string
          payment_method: string | null
          payment_reference: string | null
          status: string
          total_price: number
          trip_id: string
          user_id: string | null
        }
        Insert: {
          booking_data: Json
          booking_fee_amount: number
          booking_id?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_code?: string | null
          duffel_offer_data?: Json | null
          duffel_offer_id?: string | null
          expires_at?: string
          flight_price_sek?: number | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          total_price: number
          trip_id: string
          user_id?: string | null
        }
        Update: {
          booking_data?: Json
          booking_fee_amount?: number
          booking_id?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_code?: string | null
          duffel_offer_data?: Json | null
          duffel_offer_id?: string | null
          expires_at?: string
          flight_price_sek?: number | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          total_price?: number
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_trip_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "trip_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_trip_bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
          welcome_email_sent: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
          welcome_email_sent?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          welcome_email_sent?: boolean
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          blocked: boolean
          created_at: string
          endpoint: string
          id: string
          key_type: string
          key_value: string
        }
        Insert: {
          blocked?: boolean
          created_at?: string
          endpoint: string
          id?: string
          key_type: string
          key_value: string
        }
        Update: {
          blocked?: boolean
          created_at?: string
          endpoint?: string
          id?: string
          key_type?: string
          key_value?: string
        }
        Relationships: []
      }
      trip_booking_documents: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          trip_booking_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          trip_booking_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          trip_booking_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_booking_documents_trip_booking_id_fkey"
            columns: ["trip_booking_id"]
            isOneToOne: false
            referencedRelation: "trip_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_booking_flights: {
        Row: {
          airline: string | null
          airline_logo: string | null
          created_at: string
          duffel_offer_id: string | null
          duffel_order_id: string | null
          flight_currency_original: string | null
          flight_price_original: number | null
          flight_price_sek: number
          id: string
          outbound_arrival_time: string | null
          outbound_departure_time: string | null
          outbound_destination: string | null
          outbound_origin: string | null
          outbound_stops: number | null
          passengers: number
          return_arrival_time: string | null
          return_departure_time: string | null
          return_destination: string | null
          return_origin: string | null
          return_stops: number | null
          trip_booking_id: string
        }
        Insert: {
          airline?: string | null
          airline_logo?: string | null
          created_at?: string
          duffel_offer_id?: string | null
          duffel_order_id?: string | null
          flight_currency_original?: string | null
          flight_price_original?: number | null
          flight_price_sek?: number
          id?: string
          outbound_arrival_time?: string | null
          outbound_departure_time?: string | null
          outbound_destination?: string | null
          outbound_origin?: string | null
          outbound_stops?: number | null
          passengers?: number
          return_arrival_time?: string | null
          return_departure_time?: string | null
          return_destination?: string | null
          return_origin?: string | null
          return_stops?: number | null
          trip_booking_id: string
        }
        Update: {
          airline?: string | null
          airline_logo?: string | null
          created_at?: string
          duffel_offer_id?: string | null
          duffel_order_id?: string | null
          flight_currency_original?: string | null
          flight_price_original?: number | null
          flight_price_sek?: number
          id?: string
          outbound_arrival_time?: string | null
          outbound_departure_time?: string | null
          outbound_destination?: string | null
          outbound_origin?: string | null
          outbound_stops?: number | null
          passengers?: number
          return_arrival_time?: string | null
          return_departure_time?: string | null
          return_destination?: string | null
          return_origin?: string | null
          return_stops?: number | null
          trip_booking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_booking_flights_trip_booking_id_fkey"
            columns: ["trip_booking_id"]
            isOneToOne: false
            referencedRelation: "trip_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_booking_travelers: {
        Row: {
          address: string | null
          birth_date: string
          created_at: string
          departure_location: string
          discount_amount: number | null
          discount_code_id: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          passport_number: string | null
          phone: string
          school: string | null
          traveler_index: number
          trip_booking_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date: string
          created_at?: string
          departure_location: string
          discount_amount?: number | null
          discount_code_id?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          passport_number?: string | null
          phone: string
          school?: string | null
          traveler_index?: number
          trip_booking_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string
          created_at?: string
          departure_location?: string
          discount_amount?: number | null
          discount_code_id?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          passport_number?: string | null
          phone?: string
          school?: string | null
          traveler_index?: number
          trip_booking_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_booking_travelers_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_booking_travelers_trip_booking_id_fkey"
            columns: ["trip_booking_id"]
            isOneToOne: false
            referencedRelation: "trip_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_bookings: {
        Row: {
          birth_date: string
          created_at: string
          departure_location: string
          discount_amount: number | null
          discount_code: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          status: string
          total_price: number
          travelers: number
          trip_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          birth_date: string
          created_at?: string
          departure_location: string
          discount_amount?: number | null
          discount_code?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          phone: string
          status?: string
          total_price: number
          travelers?: number
          trip_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          birth_date?: string
          created_at?: string
          departure_location?: string
          discount_amount?: number | null
          discount_code?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          status?: string
          total_price?: number
          travelers?: number
          trip_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          trip_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_images_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_templates: {
        Row: {
          accommodation_address: string | null
          accommodation_description: string | null
          accommodation_facilities: string[] | null
          accommodation_rooms: number | null
          accommodation_size_sqm: number | null
          base_price: number | null
          base_price_accommodation: number | null
          base_price_extras: number | null
          base_price_flight: number | null
          capacity: number | null
          created_at: string
          created_by: string
          departure_location: string | null
          description: string | null
          final_payment_amount: number | null
          final_payment_date: string | null
          final_payment_type: string | null
          first_payment_amount: number | null
          first_payment_date: string | null
          first_payment_type: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          max_persons: number | null
          min_persons: number | null
          name: string | null
          price: number | null
          project_number: string | null
          second_payment_amount: number | null
          second_payment_date: string | null
          second_payment_type: string | null
          template_name: string
          trip_type: string
          updated_at: string
        }
        Insert: {
          accommodation_address?: string | null
          accommodation_description?: string | null
          accommodation_facilities?: string[] | null
          accommodation_rooms?: number | null
          accommodation_size_sqm?: number | null
          base_price?: number | null
          base_price_accommodation?: number | null
          base_price_extras?: number | null
          base_price_flight?: number | null
          capacity?: number | null
          created_at?: string
          created_by: string
          departure_location?: string | null
          description?: string | null
          final_payment_amount?: number | null
          final_payment_date?: string | null
          final_payment_type?: string | null
          first_payment_amount?: number | null
          first_payment_date?: string | null
          first_payment_type?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          max_persons?: number | null
          min_persons?: number | null
          name?: string | null
          price?: number | null
          project_number?: string | null
          second_payment_amount?: number | null
          second_payment_date?: string | null
          second_payment_type?: string | null
          template_name: string
          trip_type: string
          updated_at?: string
        }
        Update: {
          accommodation_address?: string | null
          accommodation_description?: string | null
          accommodation_facilities?: string[] | null
          accommodation_rooms?: number | null
          accommodation_size_sqm?: number | null
          base_price?: number | null
          base_price_accommodation?: number | null
          base_price_extras?: number | null
          base_price_flight?: number | null
          capacity?: number | null
          created_at?: string
          created_by?: string
          departure_location?: string | null
          description?: string | null
          final_payment_amount?: number | null
          final_payment_date?: string | null
          final_payment_type?: string | null
          first_payment_amount?: number | null
          first_payment_date?: string | null
          first_payment_type?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          max_persons?: number | null
          min_persons?: number | null
          name?: string | null
          price?: number | null
          project_number?: string | null
          second_payment_amount?: number | null
          second_payment_date?: string | null
          second_payment_type?: string | null
          template_name?: string
          trip_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          accommodation_address: string | null
          accommodation_description: string | null
          accommodation_facilities: string[] | null
          accommodation_rooms: number | null
          accommodation_size_sqm: number | null
          base_price: number | null
          base_price_accommodation: number
          base_price_extras: number
          base_price_flight: number
          capacity: number
          created_at: string
          created_by: string
          departure_date: string
          departure_location: string
          description: string | null
          final_payment_amount: number
          final_payment_date: string | null
          final_payment_type: Database["public"]["Enums"]["payment_value_type"]
          first_payment_amount: number
          first_payment_date: string | null
          first_payment_type: Database["public"]["Enums"]["payment_value_type"]
          id: string
          image_url: string | null
          is_active: boolean
          is_fullbooked: boolean
          max_persons: number | null
          min_persons: number | null
          name: string
          partner_listing_id: string | null
          price: number
          project_number: string | null
          return_date: string
          second_payment_amount: number
          second_payment_date: string | null
          second_payment_type: Database["public"]["Enums"]["payment_value_type"]
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at: string
          use_duffel_flights: boolean
        }
        Insert: {
          accommodation_address?: string | null
          accommodation_description?: string | null
          accommodation_facilities?: string[] | null
          accommodation_rooms?: number | null
          accommodation_size_sqm?: number | null
          base_price?: number | null
          base_price_accommodation?: number
          base_price_extras?: number
          base_price_flight?: number
          capacity?: number
          created_at?: string
          created_by: string
          departure_date: string
          departure_location: string
          description?: string | null
          final_payment_amount?: number
          final_payment_date?: string | null
          final_payment_type?: Database["public"]["Enums"]["payment_value_type"]
          first_payment_amount?: number
          first_payment_date?: string | null
          first_payment_type?: Database["public"]["Enums"]["payment_value_type"]
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_fullbooked?: boolean
          max_persons?: number | null
          min_persons?: number | null
          name: string
          partner_listing_id?: string | null
          price?: number
          project_number?: string | null
          return_date: string
          second_payment_amount?: number
          second_payment_date?: string | null
          second_payment_type?: Database["public"]["Enums"]["payment_value_type"]
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at?: string
          use_duffel_flights?: boolean
        }
        Update: {
          accommodation_address?: string | null
          accommodation_description?: string | null
          accommodation_facilities?: string[] | null
          accommodation_rooms?: number | null
          accommodation_size_sqm?: number | null
          base_price?: number | null
          base_price_accommodation?: number
          base_price_extras?: number
          base_price_flight?: number
          capacity?: number
          created_at?: string
          created_by?: string
          departure_date?: string
          departure_location?: string
          description?: string | null
          final_payment_amount?: number
          final_payment_date?: string | null
          final_payment_type?: Database["public"]["Enums"]["payment_value_type"]
          first_payment_amount?: number
          first_payment_date?: string | null
          first_payment_type?: Database["public"]["Enums"]["payment_value_type"]
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_fullbooked?: boolean
          max_persons?: number | null
          min_persons?: number | null
          name?: string
          partner_listing_id?: string | null
          price?: number
          project_number?: string | null
          return_date?: string
          second_payment_amount?: number
          second_payment_date?: string | null
          second_payment_type?: Database["public"]["Enums"]["payment_value_type"]
          trip_type?: Database["public"]["Enums"]["trip_type"]
          updated_at?: string
          use_duffel_flights?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "trips_partner_listing_id_fkey"
            columns: ["partner_listing_id"]
            isOneToOne: false
            referencedRelation: "partner_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_key_type: string
          p_key_value: string
          p_max_requests: number
          p_window_minutes: number
        }
        Returns: boolean
      }
      cleanup_rate_limit_log: { Args: never; Returns: undefined }
      create_trip_booking_atomic: {
        Args: {
          p_birth_date?: string
          p_departure_location?: string
          p_discount_amount?: number
          p_discount_code?: string
          p_email?: string
          p_first_name?: string
          p_last_name?: string
          p_phone?: string
          p_total_price?: number
          p_travelers?: number
          p_trip_id: string
          p_user_id?: string
        }
        Returns: string
      }
      get_user_id_by_email: { Args: { p_email: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_booking_owner: {
        Args: { booking_id: string; check_user_id: string }
        Returns: boolean
      }
      is_traveler_on_booking: {
        Args: { booking_id: string; user_email: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "partner"
      payment_value_type: "percent" | "amount"
      trip_type: "seglingsvecka" | "splitveckan" | "studentveckan"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "partner"],
      payment_value_type: ["percent", "amount"],
      trip_type: ["seglingsvecka", "splitveckan", "studentveckan"],
    },
  },
} as const
