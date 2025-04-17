import { useEffect, useState } from "react";

export default function DestinationSection({ countryName }) {
    const [imageUrl, setImageUrl] = useState("");
    const [photographerName, setPhotographerName] = useState("");
    const [photographerUrl, setPhotographerUrl] = useState("");

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const res = await fetch(
                    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
                        countryName + " landmark"
                    )}&client_id=AoOhpYPOKMx0jVLaNaOmqX3rasq8HQIvW7ZdV_-jGy8&orientation=landscape&per_page=1`
                );
                const data = await res.json();
                const firstImage = data.results[0]?.urls?.regular;
                const photographer = data.results[0]?.user;

                if (firstImage && photographer) {
                    setImageUrl(firstImage);
                    setPhotographerName(photographer.name);
                    setPhotographerUrl(photographer.links.html);
                }
            } catch (error) {
                console.error("Failed to fetch image:", error);
            }
        };

        fetchImage();
    }, [countryName]);

    return (
        <>
            {imageUrl && (
                <div className="relative w-full h-full flex items-center justify-center">
                    <img
                        src={imageUrl}
                        alt={`Popular destination in ${countryName}`}
                        className="w-full h-full object-cover "
                    />
                    {/* <p className="text-sm absolute bg-white bottom-0 right-0 px-3 rounded-t-2xl text-gray-600">
                        Photo by{" "}
                        <a href={photographerUrl} target="_blank" rel="noopener noreferrer">
                            {photographerName}
                        </a>{" "}
                        on Unsplash
                    </p> */}
                </div>
            )}
        </>
    );
}
