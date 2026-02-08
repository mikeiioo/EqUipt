import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin, Loader2 } from "lucide-react";

interface Place {
  place_id: string;
  name: string;
  address: string;
}

interface PatternData {
  tags: Record<string, number>;
  care_settings: Record<string, number>;
  total: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [patterns, setPatterns] = useState<PatternData | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSelectedPlace(null);
    setPatterns(null);
    try {
      const { data, error } = await supabase.functions.invoke("resolve-place", { body: { query } });
      if (error) throw error;
      setPlaces(data?.places || []);
      if (!data?.places?.length) {
        toast({ title: "No places found", description: "Try a different search." });
      }
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectPlace(place: Place) {
    setSelectedPlace(place);
    setLoadingPatterns(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-patterns", {
        body: { placeId: place.place_id },
      });
      if (error) throw error;
      setPatterns(data as PatternData);
    } catch {
      setPatterns({ tags: {}, care_settings: {}, total: 0 });
    } finally {
      setLoadingPatterns(false);
    }
  }

  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">Search Practices</h1>
      <p className="text-muted-foreground mb-8">Search for healthcare practices and see community-reported patterns.</p>

      <div className="flex gap-2 mb-8">
        <Input
          placeholder="Search for a healthcare practice..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={searching} className="gap-2">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </Button>
      </div>

      {/* Results */}
      {places.length > 0 && !selectedPlace && (
        <div className="space-y-2">
          {places.map((place) => (
            <Card
              key={place.place_id}
              className="cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => handleSelectPlace(place)}
            >
              <CardContent className="py-4 flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm">{place.name}</p>
                  <p className="text-xs text-muted-foreground">{place.address}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected place detail */}
      {selectedPlace && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">{selectedPlace.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedPlace.address}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPatterns ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : patterns ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {patterns.total} report{patterns.total !== 1 ? "s" : ""} from this location.
                </p>
                {patterns.total > 0 && (
                  <>
                    <div>
                      <p className="text-xs font-medium mb-2">Reported Tags</p>
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(patterns.tags).map(([tag, count]) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-2">Care Settings</p>
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(patterns.care_settings).map(([setting, count]) => (
                          <Badge key={setting} variant="outline" className="text-xs">
                            {setting} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <Button
                  onClick={() => navigate(`/report?placeId=${selectedPlace.place_id}&placeName=${encodeURIComponent(selectedPlace.name)}`)}
                  className="mt-2"
                >
                  Report from this place
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {!searching && places.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Enter a practice name or address above to search.</p>
            <p className="text-xs mt-1">Google Places integration will be connected when an API key is provided.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
