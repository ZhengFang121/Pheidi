<template>

<header class="header">

  <div class="logo">
    🏃 Pheidi
  </div>


  <nav>

    <RouterLink to="/">
      首頁
    </RouterLink>

    <RouterLink to="/player">
      玩家
    </RouterLink>

    <RouterLink to="/quest">
      任務
    </RouterLink>

    <RouterLink to="/community">
      交流大廳
    </RouterLink>

  </nav>


</header>


</template>


<style scoped>

.header {

  height:70px;

  display:flex;
  justify-content:space-between;
  align-items:center;

  padding:0 40px;

  border-bottom:1px solid #ddd;

}


nav {

display:flex;
gap:30px;

}


</style>