const baseURL = 'https://animepahe.ru';

async function searchResults(keyword) {
    try {
        const responseText = JSON.stringify(await fetch(`${baseURL}/api?m=search&l=8&q=${encodeURIComponent(keyword)}`));
        const data = JSON.parse(responseText);
        console.log(data)

        const transformedResults = data.data // where the anime info is stored
            .map(anime => ({
                title: anime.title,
                image: anime.poster,
                href: `${baseURL}/anime/${anime.session}`
            }));
        
        return JSON.stringify(transformedResults);
        
    } catch (error) {
        console.log('Fetch error:', error);
        return JSON.stringify([{ title: 'Error', image: '', href: '' }]);
    }
}

async function extractDetails(url) {
    try {
        // takes in a animepahe url and extracts the details from it
        // gets the full details of show or movie or etc
        // gets duration, airdate, and description
        if (url.match(/https:\/\/animepahe\.ru\/(.+)$/) != null) {
            const parser = new DOMParser()
            const response = await fetch(`${url}`);
            const html = await response.text();
            const formattedhtml = parser.parseFromString(html, 'text/html')
            let animeStatus = null
            let airedDate = null

            const pTags = Array.from(formattedhtml.querySelectorAll('p'))

            for (const p of pTags) {
                if (p.textContent.includes('Status:')) {
                    const a = p.querySelector('a')
                    if (!a) continue
                        const text = a.textContent.trim()
                        if (text === 'Currently Airing' || text === 'Finished Airing') {
                            animeStatus = text
                            break
                        }
                }
            }

            for (const p of pTags) {
                const text = p.textContent.trim()
                if (text.startsWith('Aired:')) {
                    beforeFormat = text.replace('Aired:', '').trim()
                    airedDate = beforeFormat.replace('\n', ' ')
                    break
                }
            }
            let animeDescription = formattedhtml.getElementsByClassName("anime-synopsis")[0].innerText

            const transformedResults = [{
                description: animeDescription || 'No description available',
                // somepeople put other names for animes here, or the duration ¯\_(ツ)_/¯
                aliases: `Status: ${animeStatus || 'Unknown'}`,
                airdate: `Aired: ${airedDate || 'Unknown'}`
            }];
            return JSON.stringify(transformedResults);
        } else {
            throw new error(`Did not pass a ${baseURL} url`);
        }

    } catch (error) {
        console.log('Details error:', error);
        return JSON.stringify([{
        description: 'Error loading description',
        aliases: 'Status: Unknown',
        airdate: 'Aired: Unknown'
        }]);
  }
}

async function extractEpisodes(url) {
    try {
        // gets the episodes from the show url
        // example: https://animepahe.ru/showID, returns all of the episodes 'https://animepahe.ru/showID/episodeID'
        const match = url.match(/https:\/\/animepahe\.ru\/(.+)$/);
        const encodedID = match[1];
        const response = JSON.stringify(await fetch(`${baseUrl}/api?m=release&id=${encodedID}&sort=episode_desc&page=1`));
        const data = JSON.parse(response);

        const transformedResults = data.data.map(episode => ({
            href: `${baseURL}/play/${encodedID}/${episode.session}`,
            number: episode.episode
        }));
        
        return JSON.stringify(transformedResults);
        
    } catch (error) {
        console.log('Fetch error:', error);
    }    
}

async function extractStreamUrl(url) {
    try {
        if (url.match(/https:\/\/animepahe\.ru\/(.+)$/) != null) {
            const response = await fetch(`${url}`);
            const domParser = new DOMParser();
            const rawhtml = await response.text();
            const formattedhtml = domParser.parseFromString(rawhtml, 'text/html');
            const downloadLink = formattedhtml.getElementById('resolutionMenu').firstElementChild

            const hlsSource = downloadLink.dataset.src;
            
            return hlsSource ? hlsSource : null;
        }
    } catch (error) {
        console.log('Fetch error:', error);
        return null;
    }
}