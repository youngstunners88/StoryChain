import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';

interface LocationContextType {
  location: LocationObject | null;
  address: string | null;
  isLoading: boolean;
  errorMsg: string | null;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationObject | null>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    requestPermission();
  }, []);

  async function requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        setIsLoading(false);
        return false;
      }

      await getCurrentLocation();
      return true;
    } catch (error) {
      setErrorMsg('Error requesting location permission');
      setIsLoading(false);
      return false;
    }
  }

  async function getCurrentLocation(): Promise<LocationObject | null> {
    try {
      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);

      // Get address from coordinates
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addr) {
        const addressStr = [
          addr.name,
          addr.street,
          addr.city,
          addr.country,
        ].filter(Boolean).join(', ');
        setAddress(addressStr);
      }

      setErrorMsg(null);
      return location;
    } catch (error) {
      setErrorMsg('Error getting location');
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <LocationContext.Provider
      value={{
        location,
        address,
        isLoading,
        errorMsg,
        requestPermission,
        getCurrentLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
