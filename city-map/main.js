import "./style.css";
import maplibregl from "maplibre-gl";
import axios from "axios";

const map = new maplibregl.Map({
    container: "map",
    style: "https://demotiles.maplibre.org/style.json",
    center: [10, 20],
    zoom: 2
});


async function load() {
    const overpassUrl = "https://overpass-api.de/api/interpreter";
    const query = `[out:json];node[place=city](if:count_tags()>5);out body;`;

    try {
        const response = await axios.post(overpassUrl, `data=${encodeURIComponent(query)}`);
        let cities = response.data.elements;



        cities = cities
            .filter(city => city.tags && city.tags.population) 
            .map(city => ({
                ...city,
                population: parseInt(city.tags.population.replace(/\s/g, ""), 10) || 0
            }))
            .sort((a, b) => b.population - a.population)



        сity(cities);

    } catch (error) {
        console.error(error);
    }
}

function сity(cities) {
    const features = cities.map(city => ({
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [city.lon, city.lat]
        },
        properties: {
            name: city.tags.name,
            population: city.population,
            radius: city.population * 0.000005
        }
    }));

    map.addSource("cities", {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: features
        }
    });

    map.addLayer({
        id: "city-circles",
        type: "circle",
        source: "cities",
        paint: {
            "circle-radius": [
                "interpolate",
                ["linear"], ["zoom"],
                2, ["*", ["get", "radius"], 0.5], 
                8, ["*", ["get", "radius"], 1.5],  
                12, ["*", ["get", "radius"], 3]  
            ],
            "circle-color": "rgba(255, 0, 0, 0.6)", 
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff"
        }
    });

}



map.on("load", load);
