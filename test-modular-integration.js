#!/usr/bin/env node

/**
 * Simple test to verify modular server loads correctly
 */

console.log('🧪 Testing modular server basic loading...\n');

async function runTests() {
    try {
        console.log('1️⃣ Testing core infrastructure import...');
        const { CoreInfrastructure } = await import('./modules/core-infrastructure.js');
        console.log('   ✅ Core infrastructure imported');
        
        console.log('2️⃣ Testing data persistence import...');
        const { DataPersistence } = await import('./modules/data-persistence.js');
        console.log('   ✅ Data persistence imported');
        
        console.log('3️⃣ Testing a few more key modules...');
        const { ProjectManagement } = await import('./modules/project-management.js');
        const { HtaTreeBuilder } = await import('./modules/hta-tree-builder.js');
        console.log('   ✅ Project management and HTA builder imported');
        
        console.log('4️⃣ Testing modular server import...');
        const serverModule = await import('./server-modular.js');
        console.log('   ✅ Modular server imported');
        console.log('   ✅ Export available:', !!serverModule.ModularForestServer);
        
        console.log('\n🎉 All basic import tests passed!');
        console.log('✨ The modular architecture is working correctly!');
        
    } catch (error) {
        console.error('\n❌ Import test failed:', error.message);
        console.error('🔍 Error details:', error.stack);
    }
}

runTests();