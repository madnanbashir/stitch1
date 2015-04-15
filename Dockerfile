FROM progrium/buildstep

RUN ln -s -f /bin/true /usr/bin/chfn
RUN mkdir -p /app
ADD . /app
RUN /build/builder

ENV LCB_DATABASE_URI mongodb://db/letschat
EXPOSE 5000