// Script de prueba para verificar deduplicación
const http = require('http');

function testAggregate() {
  const url = 'http://localhost:3000/api/aggregate?sources=https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml,https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml,https://rss.app/feeds/IchTPp234IVDaH7V.xml';
  
  http.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const items = json.items || [];
        
        console.log(`\nTotal items: ${items.length}`);
        
        // Agrupar por título
        const titleMap = new Map();
        items.forEach((item, idx) => {
          const title = item.title || '';
          if (!titleMap.has(title)) {
            titleMap.set(title, []);
          }
          titleMap.get(title).push({ idx, link: item.link });
        });
        
        // Encontrar duplicados
        const duplicates = [];
        titleMap.forEach((entries, title) => {
          if (entries.length > 1) {
            duplicates.push({ title, count: entries.length, entries });
          }
        });
        
        if (duplicates.length > 0) {
          console.log(`\n❌ Duplicados encontrados: ${duplicates.length} títulos repetidos\n`);
          duplicates.slice(0, 5).forEach(dup => {
            console.log(`"${dup.title}" aparece ${dup.count} veces:`);
            dup.entries.forEach(e => {
              console.log(`  - ${e.link}`);
            });
            console.log('');
          });
        } else {
          console.log('\n✓ No se encontraron duplicados por título');
        }
        
        // También verificar por link
        const linkMap = new Map();
        items.forEach(item => {
          const link = item.link || '';
          if (link) {
            linkMap.set(link, (linkMap.get(link) || 0) + 1);
          }
        });
        
        const linkDupes = Array.from(linkMap.entries()).filter(([_, count]) => count > 1);
        if (linkDupes.length > 0) {
          console.log(`\n❌ Enlaces duplicados: ${linkDupes.length}`);
          linkDupes.slice(0, 3).forEach(([link, count]) => {
            console.log(`  ${link} (${count} veces)`);
          });
        } else {
          console.log('\n✓ No se encontraron duplicados por enlace');
        }
        
      } catch (e) {
        console.error('Error parsing response:', e.message);
      }
    });
  }).on('error', (e) => {
    console.error('Error fetching aggregate:', e.message);
  });
}

// Esperar 1 segundo para que el servidor esté listo
setTimeout(testAggregate, 1000);
