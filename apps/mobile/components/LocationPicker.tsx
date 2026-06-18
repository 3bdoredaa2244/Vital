/**
 * LocationPicker — a Google Maps + Places picker rendered inside a WebView
 * (Expo Go-compatible; no native map module). Search an address or tap the map
 * to drop a pin; the selected { lat, lng, address } is posted back to RN.
 *
 * Requires EXPO_PUBLIC_GOOGLE_MAPS_KEY. With no key, the host screen should fall
 * back to a manual address field — this component renders a notice in that case.
 */
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { colors } from '@/constants/theme';

const KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

export interface PickedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

function html(apiKey: string, initLat: number, initLng: number): string {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0"/>
<style>html,body,#map{height:100%;margin:0}#search{box-sizing:border-box;width:90%;margin:8px 5%;padding:10px;border:1px solid #ccc;border-radius:8px;font-size:15px;position:absolute;z-index:5;top:0;left:0}</style></head>
<body>
<input id="search" placeholder="Search address"/>
<div id="map"></div>
<script>
let map, marker, geocoder;
function post(lat,lng,address){ window.ReactNativeWebView.postMessage(JSON.stringify({latitude:lat,longitude:lng,address:address||''})); }
function reverse(latlng){ geocoder.geocode({location:latlng},(res,status)=>{ const a = (status==='OK'&&res[0])?res[0].formatted_address:''; post(latlng.lat(),latlng.lng(),a); }); }
function setMarker(latlng){ if(!marker){ marker=new google.maps.Marker({map,position:latlng,draggable:true}); marker.addListener('dragend',()=>reverse(marker.getPosition())); } else { marker.setPosition(latlng); } }
function initMap(){
  const center={lat:${initLat},lng:${initLng}};
  map=new google.maps.Map(document.getElementById('map'),{center,zoom:12,disableDefaultUI:true,zoomControl:true});
  geocoder=new google.maps.Geocoder();
  map.addListener('click',(e)=>{ setMarker(e.latLng); reverse(e.latLng); });
  const input=document.getElementById('search');
  const ac=new google.maps.places.Autocomplete(input,{fields:['geometry','formatted_address']});
  ac.addListener('place_changed',()=>{ const p=ac.getPlace(); if(!p.geometry)return; map.panTo(p.geometry.location); map.setZoom(15); setMarker(p.geometry.location); post(p.geometry.location.lat(),p.geometry.location.lng(),p.formatted_address); });
}
</script>
<script async src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap"></script>
</body></html>`;
}

export function LocationPicker({
  onPick,
  initial,
}: {
  onPick: (loc: PickedLocation) => void;
  initial?: { latitude: number; longitude: number } | null;
}) {
  // Default to Cairo, Egypt.
  const lat = initial?.latitude ?? 30.0444;
  const lng = initial?.longitude ?? 31.2357;
  const source = useMemo(() => ({ html: html(KEY, lat, lng) }), [lat, lng]);

  if (!KEY) {
    return (
      <View
        className="items-center justify-center rounded-lg border p-4"
        style={{ height: 160, borderColor: colors.border, backgroundColor: colors.surface }}
      >
        <Text className="text-center font-body" style={{ color: colors.textDim, fontSize: 13 }}>
          Map unavailable (no Google Maps key configured). Enter your address below.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ height: 280, borderRadius: 8, overflow: 'hidden' }}>
      <WebView
        originWhitelist={['*']}
        source={source}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data) as PickedLocation;
            onPick(data);
          } catch {
            /* ignore */
          }
        }}
      />
    </View>
  );
}
