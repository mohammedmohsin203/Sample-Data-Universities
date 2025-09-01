'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Map, Source, Layer } from 'react-map-gl/maplibre';
import { clusterLayer, clusterCountLayer, unclusteredPointLayer } from './layers';
import { universitiesData } from "@/components/Map/universities-Data";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from "@/components/ui/drawer";
import { worldcountries } from "@/components/Map/worldCountries";

export default function Globe() {
    const mapRef = useRef(null);
    const [hoverInfo, setHoverInfo] = useState(null);
    const [drawerInfo, setDrawerInfo] = useState(null);
    const [filterMode, setFilterMode] = useState(false);
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Available categories
    const categories = ['All', 'Engineering', 'Research Institute', 'Arts & Finance'];

    // Filter universities data based on selected category
    const filteredUniversitiesData = useMemo(() => {
        if (selectedCategory === 'All') {
            return universitiesData;
        }

        return {
            ...universitiesData,
            features: universitiesData.features.filter(
                feature => feature.properties.category === selectedCategory
            )
        };
    }, [selectedCategory]);

    // Country configurations for zoom and styling
    const countryConfigs = {
        'India': {
            center: [78.9629, 20.5937],
            zoom: 5,
            defaultColor: '#00FF00',
            hoverColor: '#FF6B35',
            borderColor: '#00CC00',
            hoverBorderColor: '#CC5500'
        },
        'Afghanistan': {
            center: [67.7090, 33.9391],
            zoom: 6,
            defaultColor: '#FF4444',
            hoverColor: '#FF8888',
            borderColor: '#CC3333',
            hoverBorderColor: '#FF6666'
        },
        'South Africa': {
            center: [22.9375, -30.5595],
            zoom: 5,
            defaultColor: '#FFD700',
            hoverColor: '#FFA500',
            borderColor: '#CCAA00',
            hoverBorderColor: '#CC8800'
        },
        'Greenland': {
            center: [-42.6043, 71.7069],
            zoom: 3,
            defaultColor: '#87CEEB',
            hoverColor: '#4682B4',
            borderColor: '#5F9EA0',
            hoverBorderColor: '#4169E1'
        },
        'Australia': {
            center: [133.7751, -25.2744],
            zoom: 4,
            defaultColor: '#FF6347',
            hoverColor: '#FF4500',
            borderColor: '#CD5C5C',
            hoverBorderColor: '#DC143C'
        },
        'New Zealand': {
            center: [174.8860, -40.9006],
            zoom: 5,
            defaultColor: '#32CD32',
            hoverColor: '#228B22',
            borderColor: '#00FF32',
            hoverBorderColor: '#008000'
        },
        'United States of America': { // Note: this might be the full name in your data
            center: [-95.7129, 37.0902],
            zoom: 4,
            defaultColor: '#4169E1',
            hoverColor: '#0000FF',
            borderColor: '#1E90FF',
            hoverBorderColor: '#0066CC'
        },
        'Iran': {
            center: [53.6880, 32.4279],
            zoom: 5,
            defaultColor: '#9370DB',
            hoverColor: '#8A2BE2',
            borderColor: '#7B68EE',
            hoverBorderColor: '#6A5ACD'
        },
        'China': {
            center: [104.1954, 35.8617],
            zoom: 4,
            defaultColor: '#DC143C',
            hoverColor: '#B22222',
            borderColor: '#FF1493',
            hoverBorderColor: '#C71585'
        },
        'Russia': {
            center: [105.3188, 61.5240],
            zoom: 3,
            defaultColor: '#FF69B4',
            hoverColor: '#FF1493',
            borderColor: '#FF6347',
            hoverBorderColor: '#FF4500'
        }
    };

    // Get list of supported countries
    const supportedCountries = Object.keys(countryConfigs);

    useEffect(() => {
        const map = mapRef.current?.getMap?.();
        if (!map) return;

        // remove overlay host since we don't use react-map-gl Popup
        const container = map.getContainer();
        const overlayHost = container.querySelector('[mapboxgl-children]');
        if (overlayHost) overlayHost.remove();
    }, []);

    const onClick = async (event) => {
        // Try to find marker first
        const markerFeature = event.features?.find(f => f.source === 'universitiesData');
        if (markerFeature) {
            if (markerFeature.properties.cluster) {
                const clusterId = markerFeature.properties.cluster_id;
                const geojsonSource = mapRef.current?.getSource('universitiesData');
                const zoom = await geojsonSource.getClusterExpansionZoom(clusterId);
                mapRef.current?.easeTo({
                    center: markerFeature.geometry.coordinates,
                    zoom,
                    duration: 500,
                });
            } else {
                setDrawerInfo(markerFeature.properties);
            }
            return; // handled marker click
        }

        // Then check if country was clicked (filterMode)
        if (filterMode) {
            const countryFeature = event.features?.find(f => f.source === 'countries');
            if (countryFeature) {
                const countryName = countryFeature.properties.name;
                const countryConfig = countryConfigs[countryName];
                if (countryConfig) {
                    mapRef.current?.easeTo({
                        center: countryConfig.center,
                        zoom: countryConfig.zoom,
                        duration: 1000,
                    });
                }
            }
        }
    };

    const onHover = (event) => {
        // Handle university marker tooltips (always active)
        const universityFeature = event.features && event.features.find(f =>
            f.source === 'universitiesData' && !f.properties.cluster
        );

        if (universityFeature) {
            setHoverInfo({
                properties: universityFeature.properties,
                pixel: { x: event.point.x, y: event.point.y }
            });
        } else {
            setHoverInfo(null);
        }

        // Handle country hover (only in filter mode)
        if (filterMode) {
            const countryFeature = event.features && event.features.find(f => f.source === 'countries');
            if (countryFeature) {
                const countryName = countryFeature.properties.name;
                // Only set hover state for supported countries
                if (supportedCountries.includes(countryName)) {
                    setHoveredCountry(countryName);
                } else {
                    setHoveredCountry(null);
                }
            } else {
                setHoveredCountry(null);
            }
        }
    };

    const onMouseLeave = () => {
        setHoverInfo(null);
        if (filterMode) {
            setHoveredCountry(null);
        }
    };

    const toggleFilterMode = () => {
        setFilterMode(!filterMode);
        setHoveredCountry(null);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    return (
        <main className="h-screen relative">
            {/* Control Panel */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {/* Filter Button */}
                <button
                    onClick={toggleFilterMode}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        filterMode
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    {filterMode ? 'Filter: ON' : 'Filter: OFF'}
                </button>

                {/* Category Buttons */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2">
                            Category: {selectedCategory}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        {categories.map((category) => (
                            <DropdownMenuItem
                                key={category}
                                onClick={() => handleCategoryChange(category)}
                                className={`cursor-pointer ${
                                    selectedCategory === category
                                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                                        : ''
                                }`}
                            >
                                {category}
                                {selectedCategory === category && (
                                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Map
                ref={mapRef}
                initialViewState={{
                    latitude: 0,
                    longitude: 0,
                    zoom: 1,
                }}
                mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                interactiveLayerIds={[
                    clusterLayer.id,
                    unclusteredPointLayer.id,
                    ...(filterMode ? ['country-fill', 'country-outline'] : [])
                ]}
                onMouseMove={onHover}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
                renderWorldCopies={false}
                className="h-[50vw]"
                attributionControl={false}
                cursor={filterMode ? 'pointer' : 'default'}
            >
                <Source
                    id="universitiesData"
                    type="geojson"
                    data={filteredUniversitiesData}
                    cluster={true}
                    clusterMaxZoom={14}
                    clusterRadius={50}
                >
                    <Layer {...clusterLayer} />
                    <Layer {...clusterCountLayer} />
                    <Layer {...unclusteredPointLayer} />
                </Source>

                <Source
                    id="countries"
                    type="geojson"
                    data={worldcountries}
                >
                    <Layer
                        id="country-fill"
                        type="fill"
                        source="countries"
                        paint={{
                            'fill-color': [
                                'case',
                                // Hovered country
                                ['==', ['get', 'name'], hoveredCountry],
                                '#FF6B35',// Hover color (set directly here)

                                // Default colors
                                ['==', ['get', 'name'], 'India'], '#00FF00',
                                ['==', ['get', 'name'], 'Afghanistan'], '#FF4444',
                                ['==', ['get', 'name'], 'South Africa'], '#FFD700',
                                ['==', ['get', 'name'], 'Greenland'], '#87CEEB',
                                ['==', ['get', 'name'], 'Australia'], '#FF6347',
                                ['==', ['get', 'name'], 'New Zealand'], '#32CD32',
                                ['==', ['get', 'name'], 'United States of America'], '#4169E1',
                                ['==', ['get', 'name'], 'Iran'], '#9370DB',
                                ['==', ['get', 'name'], 'China'], '#DC143C',
                                ['==', ['get', 'name'], 'Russia'], '#FF69B4',

                                '#CCCCCC' // fallback
                            ],

                            'fill-opacity': filterMode
                                ? [
                                    'case',
                                    ['==', ['get', 'name'], hoveredCountry],
                                    0.1,
                                    ['in', ['get', 'name'], ['literal', supportedCountries]],
                                    0.6,
                                    0.1
                                ]
                                : 0,
                        }}
                    />
                    <Layer
                        id="country-outline"
                        type="line"
                        source="countries"
                        paint={{
                            'line-color': filterMode
                                ? [
                                    'case',
                                    ['==', ['get', 'name'], hoveredCountry],
                                    '#333333',
                                    ['in', ['get', 'name'], ['literal', supportedCountries]],
                                    '#000000',
                                    '#666666'
                                ]
                                : 'transparent',
                            'line-width': filterMode
                                ? [
                                    'case',
                                    ['==', ['get', 'name'], hoveredCountry],
                                    3,
                                    ['in', ['get', 'name'], ['literal', supportedCountries]],
                                    2,
                                    1
                                ]
                                : 0,
                        }}
                    />
                </Source>

                <style>{
                    `[mapboxgl-children] {
  display: none !important;
}`
                }</style>
            </Map>

            {/* Country name tooltip when in filter mode */}
            {filterMode && hoveredCountry && (
                <div className="absolute top-20 left-4 z-10 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm pointer-events-none">
                    {hoveredCountry}
                    <div className="text-xs text-gray-300 mt-1">Click to zoom in</div>
                </div>
            )}

            {/* Tooltip on hover */}
            {hoverInfo && (
                <TooltipProvider>
                    <Tooltip open>
                        <TooltipTrigger asChild>
                            <div
                                className="absolute"
                                style={{
                                    transform: "translate(-50%, -100%)",
                                    left: `${hoverInfo.pixel.x}px`,
                                    top: `${hoverInfo.pixel.y}px`,
                                }}
                            />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <div>
                                <div className="font-medium">{hoverInfo.properties.name}</div>
                                <div className="text-xs text-gray-400">
                                    {hoverInfo.properties.category}
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            {/* Drawer on click */}
            <Drawer open={!!drawerInfo} onOpenChange={() => setDrawerInfo(null)}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{drawerInfo?.name}</DrawerTitle>
                        <DrawerDescription>
                            <span>
                                Country: {drawerInfo?.country} <br/>
                                State: {drawerInfo?.state} <br/>
                                Students Count: {drawerInfo?.students} <br/>
                                Category: {drawerInfo?.category} <br/>
                            </span>
                        </DrawerDescription>
                    </DrawerHeader>
                    <DrawerClose className="absolute right-4 top-4">Close</DrawerClose>
                </DrawerContent>
            </Drawer>
        </main>
    );
}