let token = localStorage.getItem('taskToken');
let tasks = [];
let filter = 'All';
let editing = null;

const $ = x => document.getElementById(x);

lt.onclick = () => {
  lt.classList.add('active');
  rt.classList.remove('active');
  nm.classList.add('hide');
};

rt.onclick = () => {
  rt.classList.add('active');
  lt.classList.remove('active');
  nm.classList.remove('hide');
};

af.onsubmit = async e => {

  e.preventDefault();

  let reg = !nm.classList.contains('hide');

  let b = {
    email: em.value,
    password: pw.value
  };

  if (reg) {
    b.name = nm.value;
  }

  let r = await fetch(
    '/api/auth/' + (reg ? 'register' : 'login'),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(b)
    }
  );

  let j = await r.json();

  if (!r.ok) {
    return am.textContent = j.error;
  }

  if (reg) {
    return am.textContent = 'Registered. Click Login.';
  }

  token = j.token;

  localStorage.setItem(
    'taskToken',
    token
  );

  hi.textContent = 'Hi, ' + j.user.name;

  show();
};


function show() {

  auth.classList.add('hide');
  app.classList.remove('hide');

  load();
}


function login() {

  token = null;

  localStorage.removeItem(
    'taskToken'
  );

  showAuth();
}


function showAuth() {

  auth.classList.remove('hide');
  app.classList.add('hide');
}


logout.onclick = () => login();


async function load() {

  let r = await fetch(
    '/api/tasks',
    {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }
  );

  if (r.status === 401) {
    return showAuth();
  }

  tasks = await r.json();

  render();
}


function esc(s) {

  return String(s).replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[c])
  );
}


function render() {

  let a =
    filter === 'All'
      ? tasks
      : tasks.filter(
          x => x.status === filter
        );

  grid.innerHTML =
    a.map(
      t => `
        <article class="task">

          <span class="badge ${
            t.status === 'Completed'
              ? 'done'
              : ''
          }">
            ${t.status}
          </span>

          <span class="badge ${
            t.priority === 'High'
              ? 'high'
              : ''
          }">
            ${t.priority}
          </span>

          <h3>
            ${esc(t.title)}
          </h3>

          <p>
            ${esc(
              t.description ||
              'No description'
            )}
          </p>

          <small>
            Due:
            ${t.due_date || 'No date'}
          </small>

          <div class="task-actions">

            <button
              onclick="edit(${t.id})"
            >
              Edit
            </button>

            <button
              onclick="del(${t.id})"
            >
              Delete
            </button>

          </div>

        </article>
      `
    ).join('') ||
    '<p>No tasks here.</p>';
}


document
  .querySelectorAll('.filters button')
  .forEach(
    b =>
      b.onclick = () => {

        filter = b.dataset.f;

        document
          .querySelectorAll(
            '.filters button'
          )
          .forEach(
            x =>
              x.classList.remove(
                'active'
              )
          );

        b.classList.add('active');

        render();
      }
  );


document.getElementById('new').onclick =
  () => open();


cancel.onclick = () =>
  modal.classList.add('hide');


function open(t) {

  editing = t || null;

  modal.classList.remove('hide');

  mt.textContent =
    t ? 'Edit Task' : 'New Task';

  tt.value =
    t?.title || '';

  td.value =
    t?.description || '';

  ts.value =
    t?.status || 'Pending';

  tp.value =
    t?.priority || 'Medium';

  due.value =
    t?.due_date || '';
}


window.edit = id =>
  open(
    tasks.find(
      x => x.id === id
    )
  );


window.del = async id => {

  if (
    confirm(
      'Delete this task?'
    )
  ) {

    await fetch(
      '/api/tasks/' + id,
      {
        method: 'DELETE',
        headers: {
          Authorization:
            'Bearer ' + token
        }
      }
    );

    load();
  }
};


tf.onsubmit = async e => {

  e.preventDefault();

  let b = {
    title: tt.value,
    description: td.value,
    status: ts.value,
    priority: tp.value,
    due_date: due.value
  };

  let r = await fetch(
    '/api/tasks/' +
      (editing ? editing.id : ''),
    {
      method:
        editing ? 'PUT' : 'POST',

      headers: {
        'Content-Type':
          'application/json',

        Authorization:
          'Bearer ' + token
      },

      body: JSON.stringify(b)
    }
  );

  if (r.ok) {

    modal.classList.add('hide');

    load();
  }
};


if (token) {
  show();
} else {
  showAuth();
}
