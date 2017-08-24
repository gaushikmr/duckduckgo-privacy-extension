/*
 * Load the abp-filter-parser node module and 
 * pre-process the easylists.
 *
 * This will be browserifyed and turned into abp.js by running 'grunt'
 */
abp = require('abp-filter-parser');

easylists = {
    privacy: {
        url: 'https://jason.duckduckgo.com/contentblocking.js?l=easyprivacy',
        parsed: {},
    },
    general: {
        url: 'https://jason.duckduckgo.com/contentblocking.js?l=easylist',
        parsed: {},
    }
};

/*
 * Get the list data and use abp to parse.
 * The parsed list data will be added to 
 * the easyLists object.
 */
function updateLists () {
    for (let list in easylists) {
        let url = easylists[list].url

        load.loadExtensionFile({url: url, source: 'external', etag: list.etag}, (listData, response) => {
            let etag = settings.getSetting(list + '-etag')
            let newEtag = response.getResponseHeader('etag')
            
            // return if we got a cached etag and we already have processed data
            if ((etag === newEtag) && (Object.keys(easylists[list].parsed).length !== 0)) {
                console.log("Got cached list: ", list)
                return
            }

            console.log("Updating list: ", list)
        
            // sync to storage
            settings.updateSetting(list + '-etag', newEtag)

            abp.parse(listData, easylists[list].parsed)
            easylists[list].loaded = true;
        });
    }
}

// Make sure the list updater runs on start up
updateLists()

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'updateEasyLists') {
        updateLists()
    }
});

// set an alarm to recheck the lists
chrome.alarms.create('updateEasyLists', {periodInMinutes: 60})
