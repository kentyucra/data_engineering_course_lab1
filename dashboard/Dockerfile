FROM jupyter/scipy-notebook:latest

WORKDIR /home/jovyan/work

COPY requirements.txt /tmp/dashboard-requirements.txt
RUN pip install --no-cache-dir -r /tmp/dashboard-requirements.txt
